import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2/dist/fuse.esm.min.js';
import { students } from './api.js';
import { aliasMap } from './api.js';
import { fieldTypes } from './api.js';

const fuse = new Fuse(students, {
	keys: ['Name'],
	threshold: 0.3,
	includeMatches: true,
	findAllMatches: true,
});

const searchInput = document.getElementById('student-search');
const list = document.getElementById('student-list');

function formatDate(value) {
	const parts = value.split('-');
	if (parts.length === 3) {
		return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(
			2,
			'0'
		)}`;
	}
	return value;
}

function fillform(student, aliasMap = {}) {
	const allowedTypes = ['text', 'number', 'email', 'tel', 'url', 'date'];
	const inputs = [...document.querySelectorAll('input')].filter(input =>
		allowedTypes.includes(input.type)
	);

	const keyAliasList = Object.entries(student).map(([key, value]) => {
		const aliases = (aliasMap[key] || [key]).map(alias =>
			alias.toLowerCase().replace(/[^a-z0-9]/g, '')
		);
		return { key, value, aliases };
	});

	const fuse = new Fuse(keyAliasList, {
		keys: ['aliases'],
		threshold: 0.5,
		includeScore: true,
	});

	inputs.forEach(input => {
		const label = document.querySelector(`label[for="${input.id}"]`);
		const labelText = label?.textContent || '';
		const placeholder = input.placeholder || '';
		const nameAttr = input.name || '';
		const idAttr = input.id || '';

		const inputText = `${labelText} ${placeholder} ${nameAttr} ${idAttr}`
			.toLowerCase()
			.replace(/[^a-z0-9]/g, ' ')
			.trim();

		if (!inputText) return;

		const matches = fuse.search(inputText);
		if (matches.length > 0 && matches[0].score < 0.4) {
			let val = matches[0].item.value || '';
			input.value = matches[0].item.value || '';
			if (input.type === 'date') {
				val = formatDate(val);
				input.value = val;
			}
		}
	});
}

function fillSelectFields(student, aliasMap = {}) {
	const selects = [...document.querySelectorAll('select')];

	const keyAliasList = Object.entries(student).map(([key, value]) => {
		const aliases = (aliasMap[key] || [key]).map(alias =>
			alias.toLowerCase().replace(/[^a-z0-9]/g, '')
		);
		return { key, value, aliases };
	});

	const fuse = new Fuse(keyAliasList, {
		keys: ['aliases'],
		threshold: 0.3,
	});

	selects.forEach(select => {
		const label = document.querySelector(`label[for="${select.id}"]`);
		const labelText = label?.textContent || '';
		const nameAttr = select.name || '';
		const idAttr = select.id || '';

		const inputText = `${labelText} ${nameAttr} ${idAttr}`
			.toLowerCase()
			.replace(/[^a-z0-9]/g, ' ')
			.trim();

		if (!inputText) return;

		const matches = fuse.search(inputText);
		if (matches.length > 0) {
			const matchedValue = matches[0].item.value?.toLowerCase().trim();
			const foundOption = [...select.options].find(
				opt =>
					opt.textContent.toLowerCase().trim() === matchedValue ||
					opt.value.toLowerCase().trim() === matchedValue
			);

			if (foundOption) {
				select.value = foundOption.value;
			}
		}
	});
}

function fillRadioFields(student, fieldTypes = {}, aliasMap = {}) {
	const radios = [...document.querySelectorAll('input[type="radio"]')];

	const optionKeys = Object.keys(fieldTypes).filter(
		k => fieldTypes[k] === 'option'
	);
	const keyAliasList = optionKeys.map(key => ({
		key,
		aliases: aliasMap[key] || [key],
	}));

	const keyFuse = new Fuse(keyAliasList, {
		keys: ['aliases'],
		threshold: 0.4,
	});

	radios.forEach(radio => {
		const radioText = `${radio.name}`
			.toLowerCase()
			.replace(/[^a-z0-9]/g, ' ')
			.trim();

		const match = keyFuse.search(radioText)[0];
		if (!match) return;

		const matchedKey = match.item.key;
		const expectedValue = (student[matchedKey] || '').toLowerCase().trim();
		if (!expectedValue) return;

		const groupRadios = radios.filter(
			r => r.name === radio.name || r.id === radio.id
		);

		const scored = groupRadios.map(r => {
			const label = document.querySelector(`label[for="${r.id}"]`);
			const text = `${r.value} ${label?.textContent || ''} ${r.id}`
				.toLowerCase()
				.replace(/[^a-z0-9]/g, ' ')
				.trim();

			const valueFuse = new Fuse([text], {
				includeScore: true,
				threshold: 0.5,
			});
			const result = valueFuse.search(expectedValue)[0];
			return { radio: r, score: result?.score ?? 1 };
		});

		const best = scored.reduce(
			(a, b) => (a.score < b.score ? a : b),
			scored[0]
		);
		if (best && best.score < 0.5) {
			best.radio.checked = true;
		}
	});
}

function overrideFromMemory(student) {
	const map = JSON.parse(localStorage.getItem('fieldKeyMap') || '{}');
	for (const field in map) {
		const key = map[field];
		const val = student[key];
		console.log(key, val, field, map);
		if (!val) continue;

		const el =
			document.getElementById(field) ||
			document.querySelector(`[name="${field}"]`);

		if (el?.tagName === 'SELECT') {
			const opt = [...el.options].find(
				o =>
					o.textContent.toLowerCase().trim() === val.toLowerCase().trim() ||
					o.value.toLowerCase().trim() === val.toLowerCase().trim()
			);
			if (opt) el.value = opt.value;
		} else if (el?.type === 'radio') {
			const radios = [
				...document.querySelectorAll(`input[type="radio"][name="${field}"]`),
			];
			const match = radios.find(
				r => r.value.toLowerCase() === val.toLowerCase()
			);
			if (match) match.checked = true;
		} else if (el) {
			el.value = el.type === 'date' ? formatDate(val) : val;
		}
	}
}

let navigableFields = [];
let currentPointer = { index: 0, el: null, type: null };

function updateHighlight(newIndex) {
	if (currentPointer.el) {
		if (Array.isArray(currentPointer.el)) {
			currentPointer.el.forEach(el => el.classList.remove('current-focus'));
		} else {
			currentPointer.el.classList.remove('current-focus');
		}
	}

	currentPointer.index = newIndex;
	currentPointer.el = navigableFields[newIndex].el;
	currentPointer.type = navigableFields[newIndex].type;

	if (Array.isArray(currentPointer.el)) {
		if (currentPointer.el.length > 0) {
			currentPointer.el.forEach(el => el.classList.add('current-focus'));
			currentPointer.el[0].scrollIntoView({
				behavior: 'smooth',
				block: 'center',
			});
		}
	} else {
		currentPointer.el.classList.add('current-focus');
		currentPointer.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}
}

function buildNavigationList() {
	const seenRadios = new Set();
	navigableFields = [];

	const allElements = [...document.querySelectorAll('input, textarea, select')];

	allElements.forEach(el => {
		if (el.type === 'radio') {
			if (seenRadios.has(el.name)) return;
			const group = [
				...document.querySelectorAll(`input[type="radio"][name="${el.name}"]`),
			];
			navigableFields.push({ el: group, type: 'radio' });
			seenRadios.add(el.name);
		} else {
			navigableFields.push({
				el,
				type: el.tagName.toLowerCase() === 'select' ? 'select' : 'text',
			});
		}
	});

	if (navigableFields.length) {
		updateHighlight(0);
	}
}

document.querySelector('.navigation-btn.next').onclick = () => {
	if (currentPointer.index < navigableFields.length - 1) {
		updateHighlight(currentPointer.index + 1);
	}
};

document.querySelector('.navigation-btn.prev').onclick = () => {
	if (currentPointer.index > 0) {
		updateHighlight(currentPointer.index - 1);
	}
};

searchInput.addEventListener('input', () => {
	const results = fuse.search(searchInput.value);
	list.innerHTML = '';

	results.forEach(({ item, matches }) => {
		const li = document.createElement('li');
		const nameMatch = matches.find(m => m.key === 'Name');

		if (nameMatch) {
			let highlighted = '';
			let lastIndex = 0;
			nameMatch.indices.forEach(([start, end]) => {
				highlighted += item.Name.slice(lastIndex, start);
				highlighted += `<b>${item.Name.slice(start, end + 1)}</b>`;
				lastIndex = end + 1;
			});
			highlighted += item.Name.slice(lastIndex);
			li.innerHTML = highlighted;
		} else {
			li.textContent = item.Name;
		}

		li.onclick = () => {
			document.getElementById('search-view').style.display = 'none';
			fillform(item, aliasMap);
			fillSelectFields(item, aliasMap);
			fillRadioFields(item, fieldTypes, aliasMap);
			overrideFromMemory(item);
			buildNavigationList();
			document.getElementById('student-view').style.display = 'block';

			const details = document.getElementById('student-details');
			details.innerHTML = '';

			Object.entries(item).forEach(([key, value]) => {
				const row = document.createElement('li');
				const label = document.createElement('span');
				label.innerHTML = `<b>${key}:</b> ${value}`;
				const btn = document.createElement('button');
				btn.classList.add('fill');
				btn.textContent = 'Fill';
				btn.innerHTML = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" height="1.5em" width="1.5em"><path fill="currentColor" d="M19.5 31.65q-.45-.45-.45-1.1 0-.65.45-1.05l4-4h-16q-.65 0-1.075-.425Q6 24.65 6 24q0-.65.425-1.075Q6.85 22.5 7.5 22.5h15.9l-4.05-4.05q-.4-.4-.4-1.025 0-.625.45-1.075.45-.45 1.075-.45t1.075.45L28.2 23q.25.25.35.5.1.25.1.55 0 .3-.1.55-.1.25-.35.5l-6.6 6.6q-.4.4-1.025.4-.625 0-1.075-.45ZM25.95 42q-.65 0-1.075-.425-.425-.425-.425-1.075 0-.65.425-1.075Q25.3 39 25.95 39H39V9H25.95q-.65 0-1.075-.425-.425-.425-.425-1.075 0-.65.425-1.075Q25.3 6 25.95 6H39q1.2 0 2.1.9.9.9.9 2.1v30q0 1.2-.9 2.1-.9.9-2.1.9Z"/></svg>`;
				btn.onclick = () => {
					if (!currentPointer.el) return;
					
					const fieldId = Array.isArray(currentPointer.el)
						? currentPointer.el[0]?.name || currentPointer.el[0]?.id
						: currentPointer.el?.id || currentPointer.el?.name;

					console.log(fieldId);

					if (fieldId) {
						const map = JSON.parse(localStorage.getItem('fieldKeyMap') || '{}');
						map[fieldId] = key;
						localStorage.setItem('fieldKeyMap', JSON.stringify(map));
					}

					let val = value;

					if (!Array.isArray(currentPointer.el)) {
						const el = currentPointer.el;

						if (el.type === 'date') {
							val = formatDate(val);
						}

						if (['select-one'].includes(el.type)) {
							const options = [...el.options];
							const fuse = new Fuse(
								options.map(opt => ({
									value: opt.value,
									text: opt.textContent,
								})),
								{
									keys: ['text', 'value'],
									threshold: 0.4,
									includeScore: true,
								}
							);

							const result = fuse.search(val)?.[0];
							if (result) el.value = result.item.value;
						} else {
							el.value = val;
						}

						return;
					}

					if (Array.isArray(currentPointer.el)) {
						const radios = currentPointer.el;

						const fuse = new Fuse(
							radios.map(r => {
								const label = document.querySelector(`label[for="${r.id}"]`);
								return {
									radio: r,
									text: `${r.value} ${r.id} ${r.name} ${
										label?.textContent || ''
									}`
										.toLowerCase()
										.replace(/[^a-z0-9]/g, ' ')
										.trim(),
								};
							}),
							{
								keys: ['text'],
								threshold: 0.5,
								includeScore: true,
							}
						);

						const result = fuse.search(val.toLowerCase())?.[0];
						if (result?.item?.radio) {
							result.item.radio.checked = true;
						}
					}
				};
				row.appendChild(label);
				row.appendChild(btn);
				details.appendChild(row);
			});
		};

		list.appendChild(li);
	});
});

document.getElementById('back-btn').onclick = () => {
	document.getElementById('search-view').style.display = 'block';
	document.getElementById('student-view').style.display = 'none';
	searchInput.value = '';
	searchInput.focus();
	list.innerHTML = '';
};

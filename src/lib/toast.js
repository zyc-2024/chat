import { reactive } from "vue";

const state = reactive({
	items: [],
});

let nextId = 1;

export function showToast(message, type = "info", duration = 2600) {
	const id = nextId++;
	state.items.push({ id, message, type });
	window.setTimeout(() => {
		const index = state.items.findIndex((item) => item.id === id);
		if (index !== -1) state.items.splice(index, 1);
	}, duration);
}

export function useToast() {
	return { toasts: state.items, showToast };
}

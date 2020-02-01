const Trashcan = {
    state: {
        trash: []
    },
    getters: {
        getTrash(state) {
            return state.trash;
        },
        checkIfTrashcanIsEmpty(state) {
            return state.trash.length > 0;
        }
    },
    mutations: {
        setTrash(state, trash) {
            trash.forEach((media) => {
                if (state.trash.filter(m => { return m.path === media.path; }).length === 0) {
                    state.trash.push(media);
                }
            })
        },
        removeItem(state, item) {
            state.trash.splice( state.trash.indexOf(item), 1 );
        }
    },
    actions: {
        setTrash({ commit }, input) {
            commit('setTrash', input.trash);
        },
        removeItem({ commit }, input) {
            commit('removeItem', input.item);
        }
    }
}

export default Trashcan;
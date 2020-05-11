const DuplicateFiles = {
    state: {
        duplicates: []
    },
    getters: {
        getDuplicates(state) {
            return state.duplicates;
        },
        checkIfHasComparisonUnfinished(state) {
            return state.duplicates.length > 0;
        }
    },
    mutations: {
        setDuplicates(state, duplicates) {
            state.duplicates = [];
            state.duplicates = duplicates;
        }
    },
    actions: {
        setDuplicates({ commit }, input) {
            commit('setDuplicates', input.duplicates);
        }
    }
}

export default DuplicateFiles;
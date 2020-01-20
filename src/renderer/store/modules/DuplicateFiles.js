const DuplicateFiles = {
    state: {
        duplicates: []
    },
    getters: {
        getDuplicates(state) {
            return state.duplicates;
        }
    },
    mutations: {
        setDuplicates(state, duplicates) {
            state.duplicates = duplicates;
        }
    },
    actions: {
        setDuplicates({ commit }, duplicates) {
            commit('setDuplicates', duplicates);
        }
    }
}

export default DuplicateFiles;
const ComparingFiles = {
    state: {
        refreshDuplicateGroups: 0
    },
    getters: {
        refreshDuplicateGroups(state) {
            return state.refreshDuplicateGroups;
        }
    },
    mutations: {
        setRefreshDuplicateGroups(state, refreshDuplicateGroups) {
            state.refreshDuplicateGroups = refreshDuplicateGroups;
        }
    },
    actions: {
        setRefreshDuplicateGroups({ commit }, refreshDuplicateGroups) {
            commit('setRefreshDuplicateGroups', refreshDuplicateGroups);
        }
    }
}

export default ComparingFiles;
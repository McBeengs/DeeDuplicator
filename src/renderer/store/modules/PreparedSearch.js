const PreparedSearch = {
    state: {
        preparedSearch: {
            directories: [],
            extensions: []
        }
    },
    getters: {
        getPreparedSearch(state) {
            return state.preparedSearch;
        }
    },
    mutations: {
        setPreparedSearch(state, preparedSearch) {
            state.preparedSearch = preparedSearch;
        }
    },
    actions: {
        setPreparedSearch({ commit }, preparedSearch) {
            commit('setPreparedSearch', preparedSearch);
        }
    }
}

export default PreparedSearch;
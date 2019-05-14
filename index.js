import axios from 'axios'

export const withHttpCalls = ({
  baseURL = '/api',
  httpCalls = [],
  state = {},
  actions = {},
  mutations = {},
  getters = {},
  namespaced = true
}) => {
  const api = axios.create({
    baseURL
  })

  api.interceptors.request.use(
    async conf => {
      try {
        state.requesting = true
        return {
          ...conf,
          ...(state.token === ''
            ? {}
            : {
                headers: {
                  ...conf.header,
                  Authorization: `Bearer ${state.token}`
                }
              })
        }
      } catch (error) {
        state.requesting = false
      }
    },
    error => {
      state.requesting = false
      return Promise.reject(error)
    }
  )

  api.interceptors.response.use(
    response => {
      state.requesting = false
      return response
    },
    error => {
      state.requesting = false
      return Promise.reject(error)
    }
  )

  state = {
    ...state,
    requesting: false,
    token: ''
  }

  mutations = {
    ...mutations,
    setToken(state, { token }) {
      state.token = token
    },
    set(state, { key, value }) {
      state[key] = value
    }
  }
  console.log('httpCalls: ', httpCalls)

  actions = httpCalls.reduce(
    (obj, def) =>
      Object.defineProperty(obj, `${def.name ? def.name : def.url}`, {
        enumerable: true,
        configurable: true,
        value: async function({ commit }, actionArgs) {
          console.debug(
            `calling ${def.name} with payload ${JSON.stringify(actionArgs)}`
          )
          try {
            let requestPayload = {
              data: actionsArgs,
              url: def.url,
              method: `${def.method ? def.method : 'get'}`
            }
            const { data } = await api.request(requestPayload)
            // track result in store if required
            if (def.resultToStateField) {
              commit('set', { key: def.resultToStateField, value: data })
            }
            // if we need to do something with the result
            if (def.onSuccess) {
              def.onSuccess(data)
            }

            return data
          } catch (e) {
            // if we need to do something with the result
            if (def.onError) {
              def.onError(e)
            }
            // if we need to do something on specific error status
            if (e.response && e.response.status && def[e.response.status]) {
              def[e.status](e)
            }
            console.log(`something went wrong while calling grpc
                proxied method ${def.name} with argument
                ${
                  actionArgs ? JSON.stringify(actionArgs) : 'empty'
                }, got error ${e}`)
          }
        }
      }),
    {
      ...actions,
      setToken({ commit }, { token }) {
        commit('setToken', { token })
      }
    }
  )

  console.log('actions: ', actions)

  // return the vuex module
  return {
    namespaced,
    state,
    getters,
    mutations,
    actions
  }
}

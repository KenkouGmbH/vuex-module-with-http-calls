# vuex-module-with-http-calls

A helper function to automatically create vuex modules with http calls as actions.

## Install

with `yarn`:
```
yarn add vuex-module-with-http-calls
```

with `npm`:
```
npm install --save vuex-module-with-http-calls
```
## Usage

Let's suppose that we want to define a `vuex` module called `profile`. We can, for instance, create a file file `profile-vuex-module.js` and put some content inside:

```
import { withHttpCalls } from 'vuex-module-with-http-calls'

const baseURL = 'https://example.com/api'

const httpCalls = [
  // results in a call to `GET https://example.com/api/DeleteUserProfile`
  // notice that GET is the default method
  { url: 'DeleteUserProfile' },
  // results in a call to `DELETE https://example.com/api/DeleteUserProfile`
  { url: 'DeleteUserProfile', method: 'delete' },
  // results in a call to `POST https://example.com/api/GetUserProfile` with
  // data = { uid: "137faa4c-e8d7-4a98-8945-37dd7fe21af8" } argument in the
  // body. The result of the call will be stored in `state.profile` property
  {
    url: 'GetUserProfile',
    data: { uid: '137faa4c-e8d7-4a98-8945-37dd7fe21af8' },
    method: 'post',
    resultToStateField: 'profile',
    onSuccess: data => console.log('request went fine, result:', data)
    onError: {
      // keys are the http status response
      '401': error => console.log('Unauthorized', error),
      '500': error => console.log('internal server error', error)
    }
  }
]

// you can either provide state, getters, mutations and extra actions
// or choose not to, in the last case empty objects will be created and used
const profileModule = withHttpCalls({
  baseURL,
  httpCalls
})

export default profileModule
```
Notice that `url`, `method` and `data` will be passed to the underlying `axios.request` method at the moment of doing the call. The `httpCalls` examples are organized in a complexity ascending way here to point out the many options we may pass but the only required field is the `url` one. All the actions created to perform the `http` calls are marked as `async`. 

Then you can later register the `vuex` module `profileModule` by doing:
```
import profileModule from './profile-vuex-module'
...
// here `store` is the `vuex` store instance
// register the module dynamically
store.registerModule('profile', profileModule)
...
```
or
```
// or at store creation time
...
const store = new Vuex.Store({
  modules: {
    profile: profileModule
  }
})
...
```
somewhere in your code. 

## Default content of the module

The module by default has an empty `state` and `getters` objects, a single mutation `set` which receives as argument `key` and `value` and simply do `state[key] = value`, and an action `setToken` which can be used to set the authentication jwt token header, see next section. Any additional `state`, `gettters`, `actions` and `mutations` provided to the `withHttpCalls` function 
```
const profileModule = withHttpCalls({
  baseURL,
  httpCalls,
  state,
  getters,
  mutations,
  actions,
  namespaced: true // or false as needed
})
```
will be merged with these. The module created by default has `namespaced = true`.

## Authentication

You can configure to send an `Authorization: Bearer token` header on each http request by setting the `token` in the module state using the built in `setToken` action. Let's assume that somewhere in your app you authenticate against your authentication server and you get a valid `JWT` token in exchange, then you can dispacth the `setToken` action, for instance from another `vuex` module action body, by doing:
```
store.dispatch('profile/setToken', { token: 'ey...' }, { root: true })
```
From now on your module request will `Authorization: Bearer ey...` header.

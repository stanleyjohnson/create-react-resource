# Intro

For creating async data resources to be used with react suspense and error boundaries

1. [Installation](#installation)
2. [Sample Usages](#sample-usages)
3. [API](#api)
4. [Todo](#todo)

# Installation
```
npm i --save create-react-resource
```

# Sample Usages

## Declaratively

The most common use case where you would be using the using the data directly in your react components,
using Suspense to handle loading states and Error Boundaries to handle errors

```
import {createDeclarativeResource} from 'create-react-resource'

const dataService = (param1,param2) => fetch(`http://example.com/movies.json?param1=${param1}&param2=${param2}`)
  .then(function(response) {
    return response.json();
  })

const dataResource = createDeclarativeResource(dataService)
```

and in react code ...

```

const MyComponent = () => {
    const [p1,setP1] = useState()
    const [p2,setP2] = useState()
    const data = dataResource.read(p1, p2)
    return (
        ...
    )
}

const MyComponentWithSuspense = () => (
    <ErrorBoundary fallback={<h3>Something went wrong</h3>}>
        <Suspense fallback={<Spinner />}>
            <MyComponent/>
        </Suspense>
    </ErrorBoundary>
)
```
## Imperatively

1. You want to transition to the next state only after fetching some data ( eg. you want to fetch data while form is in loading state ) 

```
async()=>{
    setLoading(true)
    await submitForm()
    dataResource.clear(key) // so that the next fetch happens
    await dataResource.fetch(key)
    setLoading(false) // or some navigation
}

```
2. You want to build a infinite scrolling list

```

const YourComponent = () => {
    const getDataForPage = (page) => dataResource.fetch(page)
    // InfiniteScroller can utilize getDataForPage for making the request when it needs to
    return (
        <InfiniteScroller
            ...
            getDataForPage={getDataForPage}
        />
    )
}

```

## Clearing resources

If you want to clear your resources, say while logging out, you can call 'clear' on all of them. This can be done easily if all your resources are located in a single file . For larger apps, use a
folder.

# API

createDeclarativeResource takes a promise and an optional config object as parameters and 
returns a resource object

## resource object

It has the following keys
* read - a function which either :
1. if cache is empty, throws a promise meant to be caught by a react suspense component
2. if service has resolved successfully, returns the return value 
3. if service has thrown an error, throws the same error, meant to be caught by a react error boundary component

* clear - a function which clears the corresponding cache values
```
    dataResource.clear(p1, p2)
```
If no parameters are passed, it clears the entire cache for that resource
```
    dataResource.clear()
```

* fetch - ( when you need to use the service imperatively e.g. using async await) a function which either :
1. if cache is empty, returns the promise 
2. if service has resolved successfully, returns the return value 
3. if service has thrown an error, throws the same error
```
    async(){
        try{
            const data = await dataResource.fetch(p1, p2)
        }catch(err){

        }
    }
```

*read, clear and fetch all take the same parameters as your service as arguments and uses the same equality check as used in [map] (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#Key_equality) to check if the keys passed match those present in the cache*

## config object

```
    const dataResource = createDeclarativeResource( dataService, { lsKey:'MyData' } )
```
if a string lsKey is passed in the config object, it persists the cache to local storage on every write under the key passed


# Todo

1. Generally, server data should be considered immutable by your react components. The 'resources' can be used anywhere and mutation can cause hard to find bugs. Possible solutions include using Object.freeze ( deep freezing if possible) in dev mode. This is pending.

2. It may happen that you are passing arguments to your service which are not technically keys.
These are still considered as keys in the map which createDeclarativeResource uses internally and the map gets nested with each key. This optimization has been ignored in favour of a simpler api.
 eg.
```
    const dataService = (userEmail, param1, someConstant, param2) => ...
```

3. Any value can be used as key ( including arrays and objects which could potentially be some react state ). Ideally they should be garbage collected if they are not referenced. One possible implementation is to find the types of keys on the first pass and use WeakMap instead of Map. This is pending.

4. Cache invalidation after a timeout is pending.
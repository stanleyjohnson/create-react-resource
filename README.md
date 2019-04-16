# Intro
1.[Sample Usages](#sample-usages)
2.[API](#api)


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
    <ErrorBoundary>
        <Suspense fallback={<Spinner />}>
            <MyComponent/>
        </Suspense>
    </ErrorBoundary>
)
```
## Imperative Use Cases

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
    const [pages,setPages] = useState([0])
    const pushNextPage = setPages()
    const getDataForPage = (page) => dataResource.fetch(page)
    return (
        <>
    )
}

```

## Clearing resources

If you want to clear your resources, say while logging out, you can just call 'clear' on all of them. This can be done easily if your resources are located in a single file . For larger apps, use a
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
    dataResource.clear(p1Val, p2Val)
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
            const data = await dataResource.fetch(p1Val, p2Val)
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
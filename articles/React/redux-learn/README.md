[本文代码地址](https://github.com/applekj/frontend-knowledge/tree/master/examples/React/redux-learn)

## 一、什么是 redux

redux 是一个基于 flux 的前端架构，它的设计思想很简单，认为一个 web 应用就是一个状态机，视图与状态是一一对应的，所有的状态都保存在一个对象里。 这里有 3 个基本概念需要理清楚

**state**: 它是一个对象，应用所有的状态都保存在这个对象里，state 长什么样，view 就长什么样(注意这里的 state 跟 react 的 state 不是一个概念)

**action**: 用来改变 state 的指令，它是一个对象，可以理解为应用的输入

**reducer**: 它是一个方法，应用收到 action 以后，调用这个方法，返回一个新的 state，可以理解为应用的输出

## 二、redux 是怎么工作的

在 redux 里，真正干活的是`store`，那`store`是什么呢，如下图：  
![加载失败，请刷新网页](https://github.com/applekj/frontend-knowledge/blob/master/images/React/redux-learn/store.jpg)  
可以看到`store`就是一个对象，里面有 5 个方法，分别是`dispatch`,`getState`,`replaceRducer`,`subscribe`,`Symbol`  
要了解 redux 是如何工作的，只需要了解前 3 个核心方法即可：

**dispatch**: 视图调用此方法来发送 action 到 store,redux 规定这是改变数据的唯一方法

**getState**: 通过该方法可以拿到 state，state 与 store 的关系就是 state = store.getState()

**subscribe**: 用来监听 view 的更新函数(在 react 里，更新函数指的是 ReactDOM 的 render 方法)，一旦 state 发生变化，自动执行该函数，改变 view

结合 redux 官方例子，来看看 redux 是怎么工作的

```
import React,{Component} from 'react';
import ReactDOM from 'react-dom';
import {createStore} from 'redux';

//定义reducer
const counterReducer = (state = 0 ,action) => {
  console.log(state,'this is state!');/*打印state，这里它是一个数字*/
  switch (action.type) {
    case 'INCREMENT':
      return {value:state + 1};
    case 'DECREMENT':
      return {value:state - 1};
    default :
      return state;
  }
};

//创建store
const store = createStore(counterReducer);
console.log(store,'this is store!');/*打印store，看看store是什么*/

//定义组件
class App extends Component{
	constructor(props){
    super(props);
	}

	render(){
		return (
      <p>
      	Clicked:<span id="value">{store.getState()}</span> times  {/*获取数据，展示*/}
      	<button id="increment" onClick={()=> {store.dispatch({type:'INCREMENT'})}}>+</button>
      	<button id="decrement" onClick={() => {store.dispatch({type:'DECREMENT'})}}>-</button>
      </p>
		)
	}
};

//渲染组件
const render = () => {
  ReactDOM.render(
    <App />,
    document.getElementById('main')
  )
};

render();
//监听组件
store.subscribe(render);

//设置热更新
if (module.hot) {
  module.hot.accept();
}
```

在上例中，view 在用户点击按钮时，只负责发送 action，store 接收到 action 后，自动调用 reducer 得到新的 state，程序再通过 getState 方法拿到数据改变 view

**注意**: state 长什么样，是由 reducer 控制的，它可以是数字、字符串、数组，也可以是对象;上例中，在 reducer 里设置 state 的初始值为 0,如果没有初始值，初始值默认为 undefined，view 发送 action 时会报错，因为 undefined 与数字相加得到的是 NaN

看到这里基本明白了 redux 是怎么工作的。在实际 react 项目中，为方便使用 redux，会用到 react-redux 库，接下来介绍 react-redux 用法，务必理解 redux 的基本用法

## 三、如何使用 react-redux 库

react-redux 将组件分为两大类，UI 组件和逻辑组件（也叫容器组件），react-redux 提供一个方法 connect(),将 UI 件和逻辑件关联起来，事实上，逻辑件是通过调用 connect 方法定义的，例如：

```
const AddTodoContainer = connect()(AddTodo);
```

可以看出 connect()方法返回值也是一个方法，传入 UI 件，生成逻辑件；connect()方法可以传入两个参数，第一个参数 mapStateToProps，第二个参数 mapDispatchToProps。

**mapStateToProps**： 这个参数事实上是一个方法，它接受 state 作为参数，返回一个对象，UI 件可以获取到该对象，用于展示数据，该方法将逻辑件的数据映射到 UI 件

**mapDispatchToProps**: 这个参数是一个对象，也可以是一个方法，如果是一个方法，它返回一个对象，不管如何，UI 件都能获取到如这样的对象{filter:filter => dispatch(filter)}，该对象里的 value 值是一个方法，UI 件通过调用该方法，将 action 传给 store，改变 state

注意：这两个参数是可以省略的，如果省略，UI 件只能得到一个 dispatch 方法

**Provider**： connect()方法生成逻辑组件后，需要让逻辑组件拿到 state,如何拿到 state 呢，只需要在项目根组件外包一层即可，就像这样：

```
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import todoApp from './reducers'
import App from './components/App'

let store = createStore(todoApp);

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
)
```

结合例子，深入理解 react-redux  
修改 webpack.config.js 文件

```
'./src/counter/index.js'  改为  './src/todoList/index.js'
```

启动项目  
npm run start

> redux 并不一定要搭配 react 使用，它只是一个状态管理库，几乎可以搭配任何框架使用，如果这篇文章对您学习 redux 有帮助，不妨点个 star

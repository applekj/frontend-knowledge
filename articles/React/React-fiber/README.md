## run

```
npx http-server ./render-fiber
```

# 手写简易版 React 来彻底搞懂 fiber 架构

作为前端工程师，我们几乎每天都在使用前端框架，如果你是 React 体系，一定会经常听到 fiber 架构，那 fiber 到底是啥？与其查阅各种解释，不如手写一个 fiber 版 React，彻底理解其实现原理。

## 一、渲染 vdom

vdom 全称 virtual dom，用来申明式的描述界面，前端框架负责渲染 vdom。

比如这样一段 vdom：

```javascript
const vdom = {
    type: 'ul',
    props: {
        className: 'list',
    },
    children: [
        {
            type: 'li',
            props: {
                className: 'item',
                style: { background: 'blue', color: '#fff' },
                onClick: function () {
                    alert(1);
                },
            },
            children: ['aaa'],
        },
        {
            type: 'li',
            props: {
                className: 'item',
            },
            children: ['bbb'],
        },
        {
            type: 'li',
            props: {
                className: 'item',
            },
            children: ['ccc'],
        },
    ],
};
```

可以看出，它描述是一个 ul 元素，包含三个 li 元素，第一个 li 元素有 style 样式、onClick 事件，React 就是通过对这样的数据结构来描述界面，然后渲染到 dom。

这样的数据结构如何渲染呢？明显要用递归遍历 vdom， 构建 dom 树并渲染。

在遍历过程中，我们要对不同的节点类型做不同的处理，还要将 props 属性绑定到对应的节点上，所以 vdom 的 render 函数是这样的：

```javascript
//判断是否文本节点
const isTextNode = (vdom) => {
    return (
        typeof vdom == 'object' &&
        typeof vdom.type == 'string' &&
        vdom.type === 'TEXT_ELEMENT'
    );
};

//判断是否元素节点
const isElementNode = (vdom) => {
    return (
        typeof vdom == 'object' &&
        typeof vdom.type == 'string' &&
        vdom.type !== 'TEXT_ELEMENT'
    );
};

const render = (vdom, parent = null) => {
    const mount = parent ? (el) => parent.appendChild(el) : (el) => el;

    let dom = null;
    if (isTextNode(vdom)) {
        dom = mount(document.createTextNode(vdom.props.nodeValue));
    } else if (isElementNode(vdom)) {
        dom = mount(document.createElement(vdom.type));

        //递归遍历vdom，构建dom树
        for (const child of [].concat(...vdom.props.children)) {
            render(child, dom);
        }

        //遍历vdom的props对象，挂载到dom节点上
        for (const prop in vdom.props) {
            setAttribute(dom, prop, vdom.props[prop]);
        }
    }

    return dom;
};

//给dom树相关的节点绑定props属性
const setAttribute = (dom, key, value) => {
    if (key === 'children') {
        return;
    }
    if (typeof value == 'function' && key.startsWith('on')) {
        dom.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (typeof value == 'object' && key == 'style') {
        Object.assign(dom.style, value);
    } else if (typeof value != 'object' && typeof value != 'function') {
        dom.setAttribute(key, value);
    }
};
```

此时，vdom 的渲染逻辑就完成了，我们可以测试下效果。

![加载失败，请刷新网页](../../../../images/React/React-fiber/vdomResult.gif)

但是，vdom 写起来太麻烦，一般是通过 DSL（领域特定语言）来写，然后编译成 vdom。

下面我们采用 jsx 的方式，通过 babel 编译成 vdom。

## 二、jsx 编译成 vdom

将上面的 vdom 改成这样：

```javascript
const data = {
    b: 'bbb',
    c: 'ccc',
};

const vdom = (
    <ul className="list">
        <li
            className="item"
            style={{ background: 'blue', color: '#fff' }}
            onClick={function () {
                alert(1);
            }}
        >
            aaa
        </li>
        <li className="item">{data.b}</li>
        <li className="item">{data.c}</li>
    </ul>
);
```

配置下 babel，下载@babel/preset-react，@babel/cli，@babel/core 三个依赖包，新增.babelrc.js 文件：

```javascript
module.exports = {
    presets: [
        [
            '@babel/preset-react',
            {
                pragma: 'createElement',
            },
        ],
    ],
};
```

通过 babel 编译后的产物是这样的：

```javascript
const data = {
    b: 'bbb',
    c: 'ccc',
};
const vdom = createElement(
    'ul',
    {
        className: 'list',
    },
    createElement(
        'li',
        {
            className: 'item',
            style: {
                background: 'blue',
                color: '#fff',
            },
            onClick: function () {
                alert(1);
            },
        },
        'aaa'
    ),
    createElement(
        'li',
        {
            className: 'item',
        },
        data.b
    ),
    createElement(
        'li',
        {
            className: 'item',
        },
        data.c
    )
);
```

为啥不直接是 vdom，而是一些函数呢？因为这样会有一次执行的过程，可以放入一些动态逻辑，比如上例，从 data 对象中取值，这个过程就叫 render function，它的返回值就是 vdom。实现下 createElement：

```javascript
const createElement = (type, props, ...children) => {
    return {
        type,
        props: {
            ...props,
            children: children.map((child) =>
                typeof child === 'object' ? child : createTextElement(child)
            ),
        },
    };
};

const createTextElement = (text) => {
    return {
        type: 'TEXT_ELEMENT',
        props: {
            nodeValue: text,
            children: [],
        },
    };
};
```

目前为止，我们实现了 vdom 的渲染和 jsx 的编译，等等，那这跟 fiber 架构有什么关系呢？

大家不要急，听我一一道来，首先我们理解下 GUI 渲染线程和 JS 引擎线程。

GUI 渲染线程主要负责页面的渲染，解析 HTML、CSS，构建 DOM 树，布局和绘制等，当页面重绘或回流时，执行该线程，该线程与 JS 引擎线程互斥，当执行 JS 引擎线程时，GUI 渲染线程会挂起，等到 JS 任务队列为空时，JS 引擎才会去执行 GUI 渲染。

上例的 render 方法虽然是递归且同步的渲染 vdom，但是只有 render 方法执行完毕，才会调用 GUI 渲染线程，真正的渲染是 GUI 渲染线程做的事，假如 vdom 的节点很多，可能耗时较长，此时就会阻塞 GUI 渲染。

因此，React16 引入了 fiber 架构，将递归渲染 vdom 的任务，拆分成很多个小任务，而且可以打断，让浏览器能够抽身去响应其他的事件。那 React 是怎么实现的 vdom 渲染可打断的呢？

首先不直接渲染 vdom 了，而是先转成 fiber ，也就是 reconcile 的过程，本来 vdom 里通过 children 关联父子节点，转成 fiber 后则是通过 child 关联第一个子节点，通过 sibling 串联起下一个兄弟节点，所有节点都可以 return 到父节点，因为 fiber 是链表，所以可以打断。

然后用 schedule 来空闲时调度执行 reconcile。

最后全部转完之后，再一次性 render，构建 dom 树，这个过程叫 commit。

接下来我们实现下。

## 三、实现 Fiber

我们从上到下来做吧，也就是分别实现 schedule,reconcile,commit

schedule 就是通过空闲调度每个 fiber 节点的 reconcile（vdom 转 fiber），全部 reconcile 完了就执行 commit，删除上例中的 render 相关代码，仅保留 createElement、createTextElement，增加以下代码：

```javascript
let wipRoot = null; //根节点
let nextFiberReconcileWork = null; //下一次的reconcile任务，fiber节点

let currentRoot = null; //根节点更新前的fiber链表，用来实现增删改
let deletions = null; //需要删除的fiber节点数组

const workLoop = (deadLine) => {
    //当浏览器空闲时，执行reconcile任务
    while (nextFiberReconcileWork && deadLine.timeRemaining() > 1) {
        nextFiberReconcileWork = performNextWork(nextFiberReconcileWork);
    }
    //如果reconcile任务清空了，进入到commit阶段
    if (!nextFiberReconcileWork && wipRoot) {
        commitRoot();
    }
    requestIdleCallback(workLoop);
};

requestIdleCallback(workLoop);

//输入fiber，返回下一次需要处理的fiber，注意此时fiber不是真正的fiber，没有return、child、sibling等链表属性，也没有dom属性
const performNextWork = (fiber) => {
    let children = null;
    //首先判断是否函数节点，否则就是普通节点，此时创建真实的dom，并挂载属性
    if (fiber && fiber.type && fiber.type instanceof Function) {
        children = [fiber.type(fiber.props)];
    } else {
        fiber.dom = fiber.dom || createDom(fiber); //如果不是根节点，创建dom节点，并挂载props属性
        children = fiber.props.children;
    }

    reconcileChildren(fiber, children);

    if (fiber.child) {
        return fiber.child;
    }
    let nextFiber = fiber;
    while (nextFiber) {
        if (nextFiber.sibling) {
            return nextFiber.sibling;
        }
        nextFiber = nextFiber.return;
    }
};
```

上面的 schedule 已经开始执行了，只需要构建 nextFiberReconcileWork 即可开始执行 reconcile, reconcile 负责 vdom 转 fiber，并且还会准备好要用的 dom 节点，确定增删改（diff），通过 schedule 调度，最终把整个 vdom 树转为 fiber 链表，增加以下代码：

```javascript
const render = (element, container) => {
    wipRoot = {
        dom: container,
        props: {
            children: [element],
        },
        alternate: currentRoot, //保存fiber更新前的fiber链表
    };
    nextFiberReconcileWork = wipRoot;
    deletions = [];
};

//传入当前reconcile的fiber及它的子节点，对fiber及children，增加return、child、sibling属性，增加diff比较
const reconcileChildren = (fiber, elements) => {
    let oldFiber = fiber.alternate && fiber.alternate.child;
    let p = 0;
    let prevSibling = null;
    while (p < elements.length || oldFiber != null) {
        const element = elements[p];
        const sameType = oldFiber && element && element.type == oldFiber.type;
        let newFiber = null;
        if (sameType) {
            newFiber = {
                type: oldFiber.type,
                props: element.props,
                dom: oldFiber.dom,
                return: fiber,
                alternate: oldFiber,
                effectTag: 'UPDATE',
            };
        } else {
            if (element) {
                newFiber = {
                    type: element.type,
                    props: element.props,
                    dom: null,
                    return: fiber,
                    alternate: null,
                    effectTag: 'REPLACEMENT',
                };
            }
            if (oldFiber) {
                oldFiber.effectTag = 'DELETION';
                deletions.push(oldFiber);
            }
        }
        if (oldFiber) {
            oldFiber = oldFiber.sibling;
        }
        if (p === 0) {
            fiber.child = newFiber;
        } else if (element) {
            prevSibling.sibling = newFiber;
        }
        prevSibling = newFiber;
        p++;
    }
};
```

commit 阶段，把 reconcile 产生的 fiber 链表一次性添加到 dom 中，dom 的增、删、改也是在这个阶段完成的，增加以下代码：

```javascript
const commitRoot = () => {
    //commit阶段，首先删除fiber
    deletions.forEach(commitWork);
    //遍历根节点，构建dom树
    commitWork(wipRoot.child);
    //将根节点的fiber 赋值给currentRoot，用于后面比对fiber链表，仅对有变化的fiber节点对应的dom节点更新
    currentRoot = wipRoot;
    //全部渲染完成，删除根节点，下次出发useState，再创建即可再开启schedule
    wipRoot = null;
};

//根据effectTag，判断增、删、改，操作dom树和对应节点的属性
const commitWork = (fiber) => {
    if (!fiber) {
        return;
    }
    let domParentFiber = fiber.return;
    while (!domParentFiber.dom) {
        domParentFiber = domParentFiber.return;
    }
    const domParent = domParentFiber.dom;
    if (fiber.effectTag === 'REPLACEMENT' && fiber.dom != null) {
        domParent.appendChild(fiber.dom);
    } else if (fiber.effectTag === 'DELETION') {
        commitDeletion(fiber.dom, domParent);
    } else if (fiber.effectTag === 'UPDATE' && fiber.dom != null) {
        updateDom(fiber.dom, fiber.alternate.props, fiber.props);
    }

    commitWork(fiber.child);
    commitWork(fiber.sibling);
};

const commitDeletion = (fiber, domParent) => {
    if (fiber.dom) {
        // dom存在，是普通节点
        domParent.removeChild(fiber.dom);
    } else {
        // dom不存在，是函数组件,向下递归查找真实DOM
        commitDeletion(fiber.child, domParent);
    }
};
```

上面的例子中，我们留了几个方法，createDom、updateDom、setAttribute、removeAttribute，都是操作 dom 节点的：

```javascript
//创建真实的dom，并绑定相关属性
const createDom = (fiber) => {
    const dom =
        fiber.type === 'TEXT_ELEMENT'
            ? document.createTextNode('')
            : document.createElement(fiber.type);
    for (const prop in fiber.props) {
        setAttribute(dom, prop, fiber.props[prop]);
    }
    return dom;
};

//更新dom的属性
const updateDom = (dom, prev, next) => {
    Object.keys(prev)
        .filter((key) => key !== 'children')
        .filter((key) => !(key in next))
        .forEach((name) => {
            removeAttribute(dom, name, prev[name]);
        });
    Object.keys(next)
        .filter((key) => key !== 'children')
        .filter((key) => prev[key] !== next[key])
        .forEach((name) => {
            setAttribute(dom, name, next[name]);
        });
};

//添加属性
const setAttribute = (dom, key, value) => {
    if (key === 'children') {
        return;
    }
    if (key === 'nodeValue') {
        dom.textContent = value;
    } else if (typeof value == 'function' && key.startsWith('on')) {
        const eventType = key.slice(2).toLowerCase();
        dom.addEventListener(eventType, value);
    } else if (key === 'style' && typeof value == 'object') {
        Object.assign(dom.style, value);
    } else if (typeof value != 'object' && typeof value != 'function') {
        dom.setAttribute(key, value);
    }
};

//删除属性
const removeAttribute = (dom, key, value) => {
    if (typeof value == 'function' && key.startsWith('on')) {
        const eventType = key.slice(2).toLowerCase();
        dom.removeEventListener(eventType, value);
    } else if (key == 'style' && typeof value == 'object') {
        dom.style = {};
    } else if (typeof value != 'function' && typeof value != 'object') {
        dom.removeAttribute(key);
    }
};
```

至此，我们的简易 Fiber 版 React 就实现了，支持函数式组件，但是不支持 useState、useEffect 等 hook，这些 hook 实现起来还是很麻烦的，这里我们仅实现下 useState，其他 hook 大家有兴趣可以看看源码。

## 四、实现 useState

将上例的 vdom 改成这样：

```javascript
const data = {
    b: 'bbb',
    c: 'ccc',
};

const App = (props) => {
    const [count, setCount] = useState(1);
    return (
        <ul className="list">
            <li
                className="item"
                style={{ background: 'blue', color: '#fff' }}
                onClick={(e) => {
                    alert(1);
                }}
            >
                aaa
            </li>
            <li className="item">{data.b}</li>
            <li className="item">{data.c}</li>
            <li className="item">
                <button
                    onClick={() => {
                        setCount(count + 1);
                    }}
                >
                    +
                </button>
                <span style={{ width: '100px', display: 'inline-block' }}>
                    {count}
                </span>
                <button
                    onClick={() => {
                        setCount(count - 1);
                    }}
                >
                    -
                </button>
            </li>
        </ul>
    );
};
```

上述代码可以看出，我们的 useState 接收一个初始值，返回一个包含 state（当前值）和 setState（改变当前值的方法）的数组，需要注意的是 App 作为函数组件，每次更新的时候都会运行，也就是说这个函数中的局部变量每次更新时都会重置，那 state 就不能作为一个局部变量，而是全局变量，在 render.js 中增加以下代码：

```javascript
/* useState */
let state = null;
const useState = (init) => {
    state = state === null ? init : state;
    const setState = (value) => {
        state = value;
        wipRoot = {
            dom: currentRoot.dom,
            props: currentRoot.props,
            alternate: currentRoot,
        };
        nextFiberReconcileWork = wipRoot;
        deletions = [];
    };
    return [state, setState];
};
```

这样我们就可以使用 useState 了，测试下。

![加载失败，请刷新网页](../../../../images/React/React-fiber/useState.gif)

上面的代码只有一个 state 变量，如果有多个 useState 怎么办呢？为了支持多个 useState，我们考虑把 state 改成一个数组，多个 useState 按照顺序放进这个数组里，访问的时候通过下标来访问：

```javascript
/* useState */
let state = [];
let hookIndex = 0;
const useState = (init) => {
    const currentIndex = hookIndex;
    state[currentIndex] =
        state[currentIndex] === undefined ? init : state[currentIndex];
    const setState = (value) => {
        state[currentIndex] = value;
        wipRoot = {
            dom: currentRoot.dom,
            props: currentRoot.props,
            alternate: currentRoot,
        };
        nextFiberReconcileWork = wipRoot;
        deletions = [];
    };

    hookIndex++;
    return [state, setState];
};
```

上面的代码虽然支持了多个 useState，但是仍然只有一套全局变量，如果有多个函数组件，每个组件都来操作这套变量，组件相互间不就污染数据了吗？所以我们的 useState 数据不能放在全局变量上，而是应该存放在当前的函数 fiber 节点上，处理这个 fiber 节点时，再将对应的 useState 数据拿到全局处理：

```javascript
//申明两个全局变量，用来处理useState
let wipFunFiber = null;
let hookIndex = null;
```

useState 只在函数组件里使用，在处理当前函数 fiber 节点时，将当前 fiber 保存变为 全局变量 wipFunFiber，并初始化 useState 数据，更新 performNextWork 函数：

```javascript
const performNextWork = (fiber) => {
    // ......省略代码......
    if (fiber && fiber.type && fiber.type instanceof Function) {
        wipFunFiber = fiber;
        hookIndex = 0;
        wipFunFiber.hooks = [];
        children = [fiber.type(fiber.props)];
    } else {
        fiber.dom = fiber.dom || createDom(fiber); //如果不是根节点，创建dom节点，并挂载props属性
        children = fiber.props.children;
    }

    // ......省略代码........
};
```

在函数第一次渲染时已经将 useState 数据绑定到 wipFunFiber 节点上了，调用 setState 改变 state 时，通过 wipFunFiber.alternate 可以取到对应的 useState 数据：

```javascript
/* useState */
const useState = (init) => {
    const oldHook =
        wipFunFiber.alternate &&
        wipFunFiber.alternate.hooks &&
        wipFunFiber.alternate.hooks[hookIndex];
    const hook = {
        state: oldHook ? oldHook.state : init,
    };
    wipFunFiber.hooks.push(hook);
    hookIndex++;
    const setState = (value) => {
        hook.state = value;
        wipRoot = {
            dom: currentRoot.dom,
            props: currentRoot.props,
            alternate: currentRoot,
        };
        nextFiberReconcileWork = wipRoot;
        deletions = [];
    };

    return [hook.state, setState];
};
```

上面代码可以看出我们在使用 useState 的时候，用 hookIndex（state 下标）取 wipFunFiber.alternate.hooks 里对应的值，此时就可以解释为什么不能在条件语句中使用 useState 了？在条件语句中很可能造成 state 下标匹配不上导致取的 state 值是错的。

到此我们实现了一个比较完善的 useState，接下来我们用 hooks 模拟实现支持 class 组件，注意这个并不是 React 官方的实现。

## 五、hooks 模拟 class 组件

首先写个 Component 类，让 class 组件能继承它，再写个方法 transfer，将 class 组件转换为函数组件：

```javascript
const transfer = (Component) => (props) => {
    const component = new Component(props);
    let [state, setState] = useState(component.state);
    component.props = props;
    component.state = state;
    component.setState = setState;

    return component.render();
};

class Component {
    constructor(props) {
        this.state = null;
        this.props = props || {};
    }
}
```

此时，我们让 performNextWork 方法支持 class 组件就可以实现 class 组件的渲染和更新了，添加如下代码：

```javascript
const performNextWork = (fiber) => {
    //......省略代码......
    //增加class组件的判断
    if (Component.isPrototypeOf(fiber.type)) {
        wipFunFiber = fiber;
        hookIndex = 0;
        wipFunFiber.hooks = [];
        children = [transfer(fiber.type)(fiber.props)];
    } else if (fiber && fiber.type && fiber.type instanceof Function) {
        //......省略代码......
    } else {
        //......省略代码......
    }

    //......省略代码......
};
```

[到这里我们简单实现了一个支持 hooks 功能的 fiber 版 React，完整代码请看我 github](https://github.com/applekj/frontend-framework-practice/tree/main/render-fiber)

## 总结

1. 界面通过 vdom 描述，但是不直接写 vdom，而是通过 render function 之后产生的，这样就可以加上 props、state 和一些逻辑，动态生成 vdom。
2. React16 以前，通过 render 方法递归遍历 vdom，生成 dom 树并渲染，这个过程是同步的，可能耗时较长导致浏览器无法响应其他事件。
3. React16 之后，vdom 生成之后不再直接渲染，而是先转成 fiber ，这个 vdom 转 fiber 的过程叫 reconcile。
4. fiber 是一个链表结构，可以打断，通过 requestIdleCallback 来空闲调度 reconcile，这样不断的循环，直到所有 vdom 都转成 fiber，就开始 commit。
5. 在 commit 阶段，把 reconcile 产生的 fiber 链表通过递归遍历添加到 dom 中，构建 dom 树，dom 的增、删、改也是在这个阶段完成的。
6. reconcile 的过程会提前创建好 dom，还会标记增、删、改（diff），所以 commit 阶段执行的速度非常快。
7. 函数组件转 fiber 时，fiber 节点的 type 就是这个函数本身，通过运行 type 拿到 fiber 的 children。
8. useState 是在 fiber 节点上添加了一个数组，数组里面的每个值对应了一个 useState 数据，useState 的调用顺序必须和这个数组下标匹配，不然会报错。

## 参考资料

[手写简易版 React 来彻底搞懂 fiber 架构](https://juejin.cn/post/7063321486135656479)

[手写系列-实现一个铂金段位的 React](https://juejin.cn/post/6978654109893132318#heading-25)

[手写 React 的 Fiber 架构，深入理解其原理](https://juejin.cn/post/6844904197008130062#heading-11)

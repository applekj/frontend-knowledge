const createElement = (type, props, ...children) => {
  return {
    type,
    props: {
      ...props,
      children: children.map(child => typeof child === 'object' ? child : createTextElement(child))
    }
  };
};
const createTextElement = text => {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: []
    }
  };
};
let wipRoot = null; //根节点
let nextFiberReconcileWork = null; //下一次的reconcile，fiber节点

let currentRoot = null; //根节点更新前的fiber链表，用来实现增删改
let deletions = null; //需要删除的fiber节点数组

let wipFunFiber = null;
let hookIndex = null;
const workLoop = deadLine => {
  while (nextFiberReconcileWork && deadLine.timeRemaining() > 1) {
    nextFiberReconcileWork = performNextWork(nextFiberReconcileWork);
  }
  if (!nextFiberReconcileWork && wipRoot) {
    //如果reconcile任务清空了，进入到commit阶段
    commitRoot();
  }
  requestIdleCallback(workLoop);
};
requestIdleCallback(workLoop);
const performNextWork = fiber => {
  let children = null;
  if (Component.isPrototypeOf(fiber.type)) {
    //如果是class组件
    wipFunFiber = fiber;
    hookIndex = 0;
    wipFunFiber.hooks = [];
    children = [transfer(fiber.type)(fiber.props)];
  } else if (fiber && fiber.type && fiber.type instanceof Function) {
    //如果fiber是函数组件
    wipFunFiber = fiber;
    hookIndex = 0;
    wipFunFiber.hooks = [];
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
const render = (element, container) => {
  wipRoot = {
    dom: container,
    props: {
      children: [element]
    },
    alternate: currentRoot //保存fiber更新前的fiber链表
  };

  nextFiberReconcileWork = wipRoot;
  deletions = [];
};

//遍历elements，给fiber增加sibling、child、return属性；做fiber节点diff，增加effectTag属性
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
        effectTag: 'UPDATE'
      };
    } else {
      if (element) {
        newFiber = {
          type: element.type,
          props: element.props,
          dom: null,
          return: fiber,
          alternate: null,
          effectTag: 'REPLACEMENT'
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
const commitRoot = () => {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child); //构建dom树
  currentRoot = wipRoot;
  wipRoot = null;
};
const commitWork = fiber => {
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

/* utils */
const createDom = fiber => {
  const dom = fiber.type === 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(fiber.type);
  for (const prop in fiber.props) {
    setAttribute(dom, prop, fiber.props[prop]);
  }
  return dom;
};
const updateDom = (dom, prev, next) => {
  Object.keys(prev).filter(key => key !== 'children').filter(key => !(key in next)).forEach(name => {
    removeAttribute(dom, name, prev[name]);
  });
  Object.keys(next).filter(key => key !== 'children').filter(key => prev[key] !== next[key]).forEach(name => {
    setAttribute(dom, name, next[name]);
  });
};
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

/* useState */
const useState = init => {
  const oldHook = wipFunFiber.alternate && wipFunFiber.alternate.hooks && wipFunFiber.alternate.hooks[hookIndex];
  const hook = {
    state: oldHook ? oldHook.state : init
  };
  wipFunFiber.hooks.push(hook);
  hookIndex++;
  const setState = value => {
    hook.state = value;
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot
    };
    nextFiberReconcileWork = wipRoot;
    deletions = [];
  };
  return [hook.state, setState];
};
const transfer = Component => props => {
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
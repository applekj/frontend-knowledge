
const createElement = (type, props, ...children) => {
    props = props || {}
    return {
        type,
        props,
        children
    }
}

const isTextNode = (vdom) => {
    return typeof vdom == 'string' || typeof vdom == 'number'
}

const isElementNode = (vdom) => {
    return typeof vdom == 'object' && typeof vdom.type == 'string'
}

const isComponentNode = vdom => {
    return typeof vdom.type == 'function'
}

//给vdom绑定属性
const setAttribute = (dom, key, value) => {
    if (typeof value == 'function' && key.startsWith('on')) {
        dom.addEventListener(key.slice(2).toLowerCase(), value)
    } else if (typeof value == 'object' && key == 'style') {
        Object.assign(dom.style, value)
    } else if (typeof value != 'object' && typeof value != 'function') {
        dom.setAttribute(key, value)
    }
}

//实现Component
class Component {
    constructor(props) {
        this.props = props || {}
        this.state = null
    }

    setState(nextState) {
        this.state = nextState
    }

    componentWillMount() {
        return undefined
    }

    componentDidMount() {
        return undefined
    }
}

const render = (vdom, parent = null) => {
    const mount = parent ? (el => parent.appendChild(el)) : (el => el) //dom节点挂载到父节点内

    let dom = null

    if (isTextNode(vdom)) {  //判断是否文本节点
        dom = mount(document.createTextNode(vdom))
    } else if (isElementNode(vdom)) { //判断是否元素节点
        dom = mount(document.createElement(vdom.type))
        for (const prop in vdom.props) { //遍历vdom的props对象，挂载到dom节点上
            setAttribute(dom, prop, vdom.props[prop])
        }
        for (const child of [].concat(...vdom.children)) { //遍历子节点 这里一定要使用 [].concat(...vdom.children)??
            render(child, dom)
        }
    } else if (isComponentNode(vdom)) { //判断是否组件，这里暂时判断是否函数组件
        const props = Object.assign({}, vdom.props, {
            children: vdom.children
        })
        if (Component.isPrototypeOf(vdom.type)) { //判断是否class组件
            const instance = new vdom.type(props)
            instance.componentWillMount()
            const componentVdom = instance.render()
            instance.dom = render(componentVdom, parent)
            instance.componentDidMount()
            dom = instance.dom
        } else {
            const componentVdom = vdom.type(props) // vdom.type 就是一个用来生成组件的方法 返回一个组件
            dom = render(componentVdom, parent)
        }
    }

    return dom
}

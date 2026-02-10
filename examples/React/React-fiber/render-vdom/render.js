const isTextNode = (vdom) => {
    return typeof vdom == 'string' || typeof vdom == 'number'
}

const isElementNode = (vdom) => {
    return typeof vdom == 'object' && typeof vdom.type == 'string'
}

const render = (vdom, parent = null) => {
    const mount = parent ? (el => parent.appendChild(el)) : (el => el) //dom节点挂载到父节点内

    let dom = null
    if (isTextNode(vdom)) { //如果是文本节点
        dom = mount(document.createTextNode(vdom))
    } else if (isElementNode(vdom)) { //如果是元素节点
        dom = mount(document.createElement(vdom.type))
        for (const prop in vdom.props) { //遍历vdom的props对象，挂载到dom节点上
            setAttribute(dom, prop, vdom.props[prop])
        }
        for (const child of [].concat(...vdom.children)) { //遍历子节点
            render(child, dom)
        }
    }

    return dom
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











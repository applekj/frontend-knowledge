const data = {
  b: 'bbb',
  c: 'ccc'
};
const vdom = createElement("ul", {
  className: "list"
}, createElement("li", {
  className: "item",
  style: {
    background: 'blue',
    color: '#fff'
  },
  onClick: function () {
    alert(1);
  }
}, "aaa"), createElement("li", {
  className: "item"
}, data.b), createElement("li", {
  className: "item"
}, data.c));

// const vdom = {
//     type: 'ul',
//     props: {
//         className: 'list'
//     },
//     children: [
//         {
//             type: 'li',
//             props: {
//                 className: 'item',
//                 style: { background: 'blue', color: '#fff' },
//                 onClick: function () { alert(1) }
//             },
//             children: [
//                 'aaa'
//             ]
//         },
//         {
//             type: 'li',
//             props: {
//                 className: 'item',
//             },
//             children: [
//                 'bbb'
//             ]
//         },
//         {
//             type: 'li',
//             props: {
//                 className: 'item',
//             },
//             children: [
//                 'ccc'
//             ]
//         },
//     ]
// }

render(vdom, document.querySelector('#root'));
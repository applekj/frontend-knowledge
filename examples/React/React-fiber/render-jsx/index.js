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
const data = {
    b: 'bbb',
    c: 'ccc'
}

const vdom = <ul className='list'>
    <li className='item' style={{ background: 'blue', color: '#fff' }} onClick={function () { alert(1) }} >aaa</li>
    <li className='item'>{data.b}</li>
    <li className='item'>{data.c}</li>
</ul>

render(vdom, document.querySelector('#root'))










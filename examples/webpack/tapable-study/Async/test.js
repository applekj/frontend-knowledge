const { AsyncParallelHook } = require('tapable')

// const { AsyncParallelHook } = require('tapable')

const hook = new AsyncParallelHook(['name'])

hook.tapAsync('node', function (name, cb) {
    setTimeout(() => {
        console.log('node', name)
        cb()
    }, 3000);
})

hook.tapAsync('react', function (name, cb) {
    setTimeout(() => {
        console.log('react', name)
        cb()
    }, 2000);
})

hook.tapAsync('vue', function (name, cb) {
    setTimeout(() => {
        console.log('vue', name)
        cb()
    }, 1000);
})

hook.callAsync('张三', function () {
    console.log('end')
})

// class Lesson {
//     constructor() {
//         this.index = 0
//         this.hooks = {
//             arch: new AsyncParallelHook(['name'])
//         }
//     }

//     tapAsync() {
//         this.hooks.arch.tapAsync('node', function (name, cb) {
//             setTimeout(() => {
//                 console.log('node', name)
//                 cb()
//             }, 1000);
//         })
//         this.hooks.arch.tapAsync('react', function (name, cb) {
//             setTimeout(() => {
//                 console.log('react', name)
//                 cb()
//             }, 1000);
//         })
//     }

//     start() {
//         this.hooks.arch.callAsync('yan', function () {
//             console.log('end')
//         })
//     }
// }

// let l = new Lesson()
// l.tapAsync()
// l.start()
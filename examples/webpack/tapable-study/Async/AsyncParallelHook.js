class AsyncParallelHook {
    constructor(args) {
        this.tasks = []
    }

    tapAsync(name, task) {
        this.tasks.push(task)
    }

    callAsync(...args) {
        const cb = args.pop()
        let index = 0
        const done = () => {
            index++
            if (index == this.tasks.length) {
                cb()
            }
        }
        this.tasks.forEach(task => {
            task(...args, done)
        })
    }
}

let hook = new AsyncParallelHook(['name'])

hook.tapAsync('node', function (name, cb) {
    setTimeout(() => {
        console.log('node', name)
        cb()
    }, 1000);
})

hook.tapAsync('react', function (name, cb) {
    setTimeout(() => {
        console.log('node', name)
        cb()
    }, 1000);
})

hook.tapAsync('vue', function (name, cb) {
    setTimeout(() => {
        console.log('node', name)
        cb()
    }, 1000);
})

hook.callAsync('yan', function () {
    console.log('end')
})
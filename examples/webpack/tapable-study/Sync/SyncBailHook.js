//事件熔断
class SyncBailHook {
    constructor(args) {
        this.tasks = []
    }

    tap(name, task) {
        this.tasks.push(task)
    }

    call(...args) {
        let result = null
        let p = 0

        while (p < this.tasks.length) {
            const task = this.tasks[p]
            result = task(...args)
            if (result !== undefined) {
                break
            }
            p++
        }
    }
}

let hook = new SyncBailHook(['name'])

hook.tap('node', function (name) {
    console.log('node', name)
    return '不想学react了'
})

hook.tap('react', function (name) {
    console.log('react', name)
})

hook.call('yan')
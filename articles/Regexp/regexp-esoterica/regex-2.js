/* 位置匹配练习 */

//写一个正则表达式，要求不配任何东西
const notMatch = (str) => {
    let regex = /.^/
    return regex.test(str)
};

//写一个正则，将数字类型的字符串变为千位分隔符表示，比如"12345678 123456789"变为"12,345,678 123,456,789"
const toThousands = (str) => {
    let regex = /(?=(\d{3})+$)/g // => 12345678 ,123,456,789  并不想要123前面还逗号，再优化下
    regex = /(?!\b)(?=(\d{3})+$)/g // => 12345678 123,456,789  此时前面的数字12345678没有变，再改下
    regex = /(?!\b)(?=(\d{3})+\b)/g // => 12,345,678 123,456,789  (?!\b)就是\B
    regex = /\B(?=(\d{3})+\b)/g
    return str.replace(regex, ',')
};


//验证密码，密码长度6-12位，由数字、小写字母和大写字母组成，但必须至少包括2种字符
const checkPassword = (str) => {
    let regex = /((?=.*[0-9])(?=.*[a-z])|(?=.*[0-9])(?=.*[A-Z])|(?=.*[a-z])(?=.*[A-Z]))^[0-9a-zA-Z]{6,12}$/g
    regex = /((?!^[0-9]{6,12}$)(?!^[a-z]{6,12}$)(?!^[A-Z]{6,12}$))^[0-9a-zA-Z]{6,12}$/
    return regex.test(str)
};
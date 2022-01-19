const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

// 检查是否登录过的中间件
function checkLogin(pageObj) {
  // pageObj是页面对象，当页面对象onshow函数调用的时候，就会触发该校验逻辑
  // console.log(123)
  if (pageObj.onLoad) {
    let _onLoad = pageObj.onLoad;
    pageObj.onLoad = function() {
      if (wx.getStorageSync('access_token').length == 0 || wx.getStorageSync('emp_code') == ""  ) {
        wx.redirectTo({
          url: '/pages/login/login',
        })
      }
      else {
        // console.log("已经登录过了哦哦哦"+wx.getStorageSync('access_token'));
      }
    }
  }
  return pageObj;
}

module.exports = {
  formatTime: formatTime,
  checkLogin: checkLogin,
}

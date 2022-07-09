// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    if (!wx.cloud) {
      console.error('请使用2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        traceUser: true
      })
    }

    // 调用云函数以获取openid
    wx.cloud.callFunction({
      // 云函数名称
      name: 'get_openid',
      // 传给云函数的参数
      data: {

      },
    }).then(res => {
      const openid = res.result.openid;
      const unionid = res.result.unionid;
      if (openid && unionid) { 
        wx.setStorageSync('openid', openid);
        wx.setStorageSync('unionid', unionid);
        // console.log(openid)
      } else {
        console.error('openid获取失败');
      }
    }).catch(console.error);


    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
  },
  globalData: {
    userInfo: null
  },

  globalData: {
    serverUrl: "http://202.116.3.50:8100",  // 测试服务器
    // serverUrl: "https://api.jnurobot.com",  // 生产服务器 
    // serverUrl: "http://127.0.0.1:4523/mock/992675",  // MOCK数据
    backgroundColor: '#',
    emp_code: "",
    
    normalHttpCode: 200,
    normalBusinessCode: 200
  },

  // 根据状态码进行判断
  processPostRequestStatusCode(code) {
    // console.log('接收到code is ', code);
    if (code == 500) {
      this.showErrorToast("服务器异常");
    }
    else if (code == 422) {
      this.showErrorToast("参数错误");
    }
    else if (code == 401) {
      this.showErrorToast('登录状态已经过期请重新登录');
      try {
        wx.removeStorageSync('emp_code');
        wx.removeStorageSync('emp_name');
        wx.removeStorageSync('access_token');
        wx.removeStorageSync('token_type');
        wx.navigateTo({
          url: '/pages/login/login',
        })
      } catch (e) {
        console.log("removeStorageSync error:", e);
      }
    }
  },


  // 根据业务状态码进行判断
  processPostRequestConcreteCode(code, message) {
    if(code != 200) {
      this.showErrorToast(`${message}`);
    }
  },

  // 成功情况下弹窗
  showSuccessToast(title) {
    wx.showToast({
      title: title,
      icon: 'success',
      duration: 1000,
      success:() => {},
      fail:(res) => {
        console.log("successToast failed,", res);
      }
    })
  },


  // 失败情况下弹窗
  showErrorToast(title) {
    wx.showToast({
      title: title,
      icon: 'none',
      duration: 1500,
      success:() => {},
      fail:(res) => {
        console.log("errorToast failed,", res);
      }
    })
  },

})

// pages/login/login.js

// 获取公共的app
const app =  getApp();

const normalHttpCode  = app.globalData.normalHttpCode;
const normalBusinessCode = app.globalData.normalBusinessCode;

Page({

  data: {
    username: '', 
    password: '',
    serverUrl: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 从全局数据中取出服务器地址
    this.setData({
      serverUrl: app.globalData.serverUrl,
    })

    // 从本地缓存中取出用户名及密码
    let preUsername = wx.getStorageSync('username');
    let prePassword = wx.getStorageSync('password');
    this.setData({
      username: preUsername,
      password: prePassword
    })
  },

  // 发送登录请求（传递账户名和密码信息）
  login() {
    // console.log('locallogin');
    let username = this.data.username;
    let password = this.data.password ;
    // console.log(username, password);
    // 判空操作
    if(!username||!password) {
      app.showErrorToast("请输入完整的用户名和密码");
      return;
    }
    console.log(this.data.serverUrl + '/pda/suz/login')
    // 向后台发送用户名和密码
    wx.request({ 
      // url: 'http://202.116.3.50:8001/WeChatpro/getUserInfo',
      // url: 'http://202.116.3.50:8300/pda/suz/LoginForToken',
      url: this.data.serverUrl + '/pda/suz/login',
      
      data: {
          username: username,
          password: password,
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      method: 'POST',
      dataType: 'json',
      success: (result) => {
        console.log('post请求发送成功',result)
        // console.log(result.statusCode)
        
        if(result.statusCode == normalHttpCode) {
          // console.log("statusCode200");
          if (result.data.code == normalBusinessCode) {
            // console.log("data.code 200")
            app.showSuccessToast("登录成功");
            // // 设置全局数据
            // app.globalData.username = result.data.data.emp_name;
            // // 保存工卡号备用
            // app.globalData.emp_code = username;
            
            console.log(username,password,result.data.data.emp_name);
            // 设置缓存
            // 保存token和账号密码
            wx.setStorageSync('access_token', result.data.data.access_token);
            wx.setStorageSync('token_type', result.data.data.token_type);
            wx.setStorageSync('username', username);
            wx.setStorageSync('password', password);
            wx.setStorageSync('emp_code', username);
            wx.setStorageSync('emp_name', result.data.data.emp_name);

            // 跳转到home页面
            wx.switchTab({
              url: '/pages/home/home',
            })
          }
          else if (result.data.code == 400) {

            app.showErrorToast(result.data.message);
            wx.setStorageSync('username', '');
            wx.setStorageSync('password', '')
          }
          else {
            app.showErrorToast(result.data.message);
            wx.setStorageSync('username', '');
            wx.setStorageSync('password', '')
          }
         
        }
        else if (result.statusCode == 500) {
          app.showErrorToast("服务器异常");
        }
      },
      fail(res) {
        console.log(res.errMsg)
        app.showErrorToast("本地网络故障");

      }
    })
  },

  // 获取用户输入的密码
  inputPassword(content) {
    this.setData({
      password: content.detail.value
    })
  }, 
  // 获取到用户输入的用户名
  inputUsername(content) {
    this.setData({
      username: content.detail.value
    })
  }

})
// pages/home/home.js
// 获取应用实例
const app = getApp();

const normalHttpCode  = app.globalData.normalHttpCode;
const normalBusinessCode = app.globalData.normalBusinessCode;
// 获取校验登录的中间件
let check_login = require("../../utils/util");

const ON_DUTY_STATUS = 3;
const OFF_DUTY_STATUS = 2;

// Page(check_login.checkLogin({
Page({

  data: {
    userId: 1,
    userName: ''
  },
  onLoad: function (options) {
    this.setData({
      userId: wx.getStorageSync('emp_code'),
      userName: wx.getStorageSync('emp_name')
    });
    // console.log("123");
  },
  onShow: function () {
    this.setData({
      userId: wx.getStorageSync('emp_code'),
      userName: wx.getStorageSync('emp_name')
    });
    // console.log("123");
    // console.log("456");
  },
  onDuty() {
    console.log("一键在岗");
    
    this.oneKeyDutyRequest(ON_DUTY_STATUS);
  },
  offDuty() {
    console.log("一键离岗");
    this.oneKeyDutyRequest(OFF_DUTY_STATUS);
  },
  oneKeyDutyRequest(status) {
    const that = this;
    const url = app.globalData.serverUrl+"/pda/suz/personal/onekeyduty" ;
    wx.request({
      url: url,
      data: {
        operator_status: status 
      },
      header: {
        "content-type": "application/json",
        "Authorization": wx.getStorageSync('token_type')+ " " +wx.getStorageSync('access_token')
      },
      method: 'POST',
      success: (result) => {
        console.log(result);
        app.processPostRequestStatusCode(result.statusCode);
        if (result.statusCode == normalHttpCode) {
          app.showSuccessToast("变更成功");
        }
      },
      fail: (res) => {
        app.showErrorToast("本地网络故障");
      },
      complete: (res) => {},
    })
  },
  logout() {
    console.log("退出登录");
  
    const promise = new Promise (function (resolve, reject) {
      wx.clearStorageSync();

      resolve();
    });

    promise.then(function resolve(params) {
      console.log("清理成功");
      wx.navigateTo({
        url: '/pages/login/login',
      })
      app.showSuccessToast("退出成功");
    }, function reject(params) {
      console.log("失败");
    })

    
  },

// }))
})

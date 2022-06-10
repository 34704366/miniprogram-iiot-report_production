// index.js
// 获取应用实例
const app = getApp()
// 获取校验登录的中间件
let check_login = require("../../utils/util");

const normalHttpCode  = app.globalData.normalHttpCode;
const normalBusinessCode = app.globalData.normalBusinessCode;

Page(check_login.checkLogin({
  data: {
    serverUrl: '',  // 服务器地址
    task: '暂无',  // 当前任务名，默认是暂无 
    startTime: '-',  // 当前任务的开始时间

    scanResult: '',
  },
  onLoad(){
    // console.log("我的token"+wx.getStorageSync('access_token'));
  
  }, 
  scanCode() {
    const that = this;
    wx.scanCode({
      success: (res) => {
        // app.showErrorToast("未识别的信息");

        // // console.log(res.result);
        // const result = res.result;
        // that.setData({
        //   scanResult: res.result
        // })
        // if(result=='material') {
        //   wx.navigateTo({
        //     url: `/pages/materail/materail?name=${this.data.scanResult}`,
        //     success: (result) => {},
        //     fail: (res) => {},
        //   })
        // }
        // else if(result=='device') {
        //   wx.navigateTo({
        //     url: `/pages/warehouse/warehouse?name=${this.data.scanResult}`,
        //   })
        // }
        // else {
        //   wx.showToast({
        //     title: '找不到该二维码的信息！',
        //     icon: 'error'
        //   })
        // }

        const code_info = res.result;

        wx.request({
          url: app.globalData.serverUrl + '/pda/suz/index/scancode',
          header: {
            "content-type" : "application/json",
            "Authorization" : wx.getStorageSync('token_type')+" "+wx.getStorageSync('access_token')
          },
          data: {
            code_info: code_info
          },
          method: "GET",
          dataType: 'json',
          success: (result) => {
            console.log(result);
            
            // http码
            if(result.statusCode == normalHttpCode) {
              // 业务状态码
              if (result.data.code == normalBusinessCode) {
                const data = result.data.data;
                // 如果扫到的是仓库
                if (data.type == 'repo') {
                  // 如果repo_code不为空
                  if (data.repo_code) {
                    console.log('跳转');
                    // 由于switchTab无法传参，所以用set/getStorage来传参
                    wx.setStorage({
                      key: 'repo_code',
                      data: data.repo_code
                    })
                    // 跳转到仓库
                    wx.switchTab({
                      url: '/pages/materail/materail',
                      success: (result) => {
                      },
                      fail: (res) => {
                        console.log(res)
                        wx.removeStorage({
                          key: 'repo_code',
                        })
                      },
                      complete: (res) => {},
                    })
                  }
                  else {
                    app.showErrorToast('后台错误，传回的repo_code为空');
                  }
                } else if (data.type == 'machine') {
                  // 如果machine_code不为空
                  if (data.machine_code) {
                    wx.setStorage({
                      key: 'machine_code',
                      data: data.machine_code
                    })
                    // 跳转到设备页面
                    wx.switchTab({
                      url: '/pages/device/device',
                      success: (result) => {
                      },
                      fail: (res) => {
                        console.log(res)
                        wx.removeStorage({
                          key: 'repo_code',
                        })
                      },
                      complete: (res) => {},
                    })
                  } else {
                    app.showErrorToast('后台错误，传回的repo_code为空');
                  }
                } else {
                  app.showErrorToast('未识别的二维码');
                }

              }
              else {
                // 业务码判断打印错误
                app.processPostRequestConcreteCode(result.data.code, result.data.message);
              }
            
            }
            else {
              // 对code码进行校验并且处理
              app.processPostRequestStatusCode(result.statusCode);
            }

          },
          fail: (res) => {
            app.requestSendError(res);
          },
          complete: (res) => {},
        })

      },
      fail: (res) => {
        console.log(`扫描失败`)
        wx.showToast({
          title: '扫描失败',
          icon: 'error'
        })
      }
    })
    
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    
  },
}))

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
  handleRefresh() {
    // 延迟动画加载
    setTimeout(() => {
      console.log('handle refresh');
      //停止下拉刷新
      wx.stopPullDownRefresh();
    }, 300)
  },

  onPullDownRefresh:function(){
    
    this.handleRefresh()
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
          url: app.globalData.serverUrl + '/pda/suz/index/scan',
          header: {
            "content-type" : "application/json",
            "Authorization" : wx.getStorageSync('token_type')+" "+wx.getStorageSync('access_token')
          },
          data: {
            qr_code: code_info
          },
          method: "GET",
          dataType: 'json',
          success: (result) => {
            console.log(result);
            
            // http码
            if(result.statusCode == normalHttpCode) {
              // 业务状态码
              if (result.data.code == normalBusinessCode) {
                const data = result.data;
                console.log(data)
                // 如果扫到的是仓库
                if (data.qr_type == 'repo' || data.qr_type == 'pallet') {
                  // 如果repo_code不为空
                  if (data.data) {
                    console.log('跳转');
                    // 由于switchTab无法传参，所以用set/getStorageSync来传参
                    wx.setStorage({
                      key: 'jump_data',
                      data: data.data,
                    })
                    // 跳转到仓库
                    wx.switchTab({
                      url: '/pages/materail/materail',
                      success: (result) => {
                      },
                      fail: (res) => {
                        console.log(res)
                        wx.removeStorage({
                          key: 'jump_data',
                        })
                      },
                      complete: (res) => {},
                    })
                  }
                  else {
                    app.showErrorToast('后台错误，传回的数据为空');
                  }
                } else if (data.qr_type == 'machine') {
                  // 如果task_code不为空 （以task_code为准）
                  if (data.data) {
                    wx.setStorage({
                      key: 'jump_task_data',
                      data: data.data
                    })
                    // 跳转到设备页面
                    wx.switchTab({
                      url: '/pages/device/device',
                      success: (result) => {
                      },
                      fail: (res) => {
                        console.log(res)
                        wx.removeStorage({
                          key: 'jump_task_data',
                        })
                      },
                      complete: (res) => {},
                    })
                  } else {
                    app.showErrorToast('后台错误，传回的jump_task_data为空');
                  }
                } else {
                  app.showErrorToast('未识别的二维码');
                }

              }
              else {
                // 业务码判断打印错误
                app.processPostRequestConcreteCode(result.data.message);
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
      }
    })
    
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    
  },
}))

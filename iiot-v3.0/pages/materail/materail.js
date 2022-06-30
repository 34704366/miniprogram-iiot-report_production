const app = getApp();
const normalHttpCode  = app.globalData.normalHttpCode;
const normalBusinessCode = app.globalData.normalBusinessCode;

// pages/materail/materail.js
Page({

  data: {
    warehouseList: [],      // 仓库信息列表
    warehouseListIndex: 0,      
    palletsList:[],        // 卡板信息列表
    palletsListIndex: 0,
    showModal: false,       // modal框控制位
    showWarehouseModal: false,  // 仓库扫描卡板的modal框的控制位
    showPalletsModal: false,  // 卡板扫描物料的modal框的控制位
    title: 'xxx',
    showCode: 'xxx',
    array:['123','22','33'],
    index:0,
    sourceArray: [],
    sourceIndex: 0,
    materialArray: [],
    materialIndex: 0,
    material_num: 0,
    material_code: 0,

    InWarehouseInfoArray: [],
    InWarehouseInfoIndex: 0,

    inWarehouseNumber: 0,
    inPalletsNumber: 0,

    selected_repo_code: '',

    modalWarehouseData: {},    // 仓库扫描卡板得到需要展示的信息
    modalPalletsData: {},     // 卡板扫描物料得到的需要展示的信息      
  },

  // 刷新页面重新拉取数据
  refreshData() {
    // 获取设备列表
    this.getWarehouseList();
    this.getpalletsList();
  },
  onLoad: function (options) {
    this.refreshData();
  },

  onShow: function (options) {
    // this.refreshData();
    const that = this;


    wx.getStorage({
      key: 'repo_code',
      success(res) {
        if (res.data != '') {
          // 放入appData中,然后请求设备列表的回调函数会去判断这个字段是否为空
          // 如果不为空，就将该信息展开
          that.setData({
            selected_repo_code: res.data
          })


          // 拿到repo_code以后删除掉
          wx.removeStorage({
            key: 'repo_code',
          })
        }
      },
      fail(res) {
        // console.log('repo_code缓存为空')
        that.setData({
          selected_repo_code: '',
        })
      }
    })
  },
  getWarehouseList() {
    
    let that = this;
    wx.request({
      url: app.globalData.serverUrl + '/pda/suz/repos',
      header: {
        "content-type" : "application/json",
        "Authorization" : wx.getStorageSync('token_type')+" "+wx.getStorageSync('access_token')
      },
      method: "GET",
      dataType: 'json',
      success: (result) => {
        // console.log(result);

        // http码
        if(result.statusCode == normalHttpCode) {
          // 业务状态码
          if (result.data.code == normalBusinessCode) {
            // app.showSuccessToast("成功");

            let list = [];
            for (const item of result.data.data) {
              item.onHide = 1;
              list.push(item);
            }

            that.setData({
              warehouseList: list,
            });
            
            // 判断是否是由扫码跳转而来
            const selected_repo_code = that.data.selected_repo_code;

            if (selected_repo_code != '') {
              let newList = list;
              for (const item of newList) {
                // 如果扫码的结果是该库
                if (selected_repo_code == item.repo_code) {
                  item.onHide = 0;
                }
              }
              that.setData({
                warehouseList: newList
              })
            }

          } else {
            // 业务码判断打印错误
            app.processPostRequestConcreteCode(result.data.code, result.data.message);
          }
        } else {
          // 对code码进行校验并且处理
          app.processPostRequestStatusCode(result.statusCode);
        }
      },
      fail: (res) => {
        // app.requestSendError(res);
      },
      complete: (res) => {},
    })
  },

  getpalletsList() {
    
    let that = this;
    wx.request({
      url: app.globalData.serverUrl + '/pda/suz/pallets',
      header: {
        "content-type" : "application/json",
        "Authorization" : wx.getStorageSync('token_type')+" "+wx.getStorageSync('access_token')
      },
      method: "GET",
      dataType: 'json',
      success: (result) => {
        // http码
        if(result.statusCode == normalHttpCode) {
          // 业务状态码
          if (result.data.code == normalBusinessCode) {
            const data = result.data.data;
            // console.log(data);
            let list = [];
            for (let item of data) {
              item.onHide = 1;

              list.push(item);
            }

            that.setData({
              palletsList: list,
            });



          } else {
            // 业务码判断打印错误
            app.processPostRequestConcreteCode(result.data.code, result.data.message);
          }
        } else {
          // 对code码进行校验并且处理
          app.processPostRequestStatusCode(result.statusCode);
        }
      },
      fail: (res) => {
        // app.requestSendError(res);
      },
      complete: (res) => {},
    })
  },

  // 展开折叠信息
  unfoldWarehouse(event) {
    // console.log(event);
    const index = event.currentTarget.dataset.index;
    let list = this.data.warehouseList;
    // 将对应字典中的onHide标志位改变成0
    list[index].onHide = 0;
    this.setData({
      warehouseList: list,
    })
  },

  // 展开折叠信息
  unfoldPallets(event) {
    // console.log(event);
    const index = event.currentTarget.dataset.index;
    let list = this.data.palletsList;
    // 将对应字典中的onHide标志位改变成0
    list[index].onHide = 0;
    this.setData({
      palletsList: list,
    })
  },

  // 折叠信息
  foldWarehouse(event) {
    // console.log(event);
    const index = event.currentTarget.dataset.index;
    let list = this.data.warehouseList;
    // 将对应字典中的onHide标志位改变成0
    list[index].onHide = 1;
    this.setData({
      warehouseList: list,
    })
  },

  // 折叠信息
  foldPallets(event) {
    // console.log(event);
    const index = event.currentTarget.dataset.index;
    let list = this.data.palletsList;
    // 将对应字典中的onHide标志位改变成0
    list[index].onHide = 1;
    this.setData({
      palletsList: list,
    })
  },

  // 仓库中点击入库按钮的动作
  inWarehouse(event) {
    const index = event.currentTarget.dataset.index;    
    
    const code = event.currentTarget.dataset.code;   // 发送post请求的仓库编号
    const title = event.currentTarget.dataset.title;   // 显示在modal上的title
    const showCode = event.currentTarget.dataset.showCode;  // 显示在modal上的name
    // console.log(code);
    const type = 'repo';    // 扫码类型为仓库扫卡板
    this.scanCode(type, code, title, showCode);
  },

  // 卡板中点击入库按钮的动作
  inPallets(event) {
    const index = event.currentTarget.dataset.index;

    const code = event.currentTarget.dataset.code;    // post请求的仓库编号
    const title = event.currentTarget.dataset.title;   // 显示在modal上的title
    const showCode = event.currentTarget.dataset.showCode;  // 显示在modal上的code

    const type = 'pallet';   // 扫码类型为卡板扫物料
    this.scanCode(type, code, title, showCode);
  },

  // 扫码逻辑
  scanCode(type, code, title, showCode) {
    const that = this;
    wx.scanCode({
      success: (res) => {
        // app.showErrorToast("未识别的信息");
        // console.log(res.result);

        const resultCode = res.result;   // 扫码结果
        const qr_code = resultCode;    // 要传递的参数
        let url = '';
        let data = {};

        // 判断是仓库信息框中扫码还是卡板信息扫码
        if (type == 'repo') {
          url = '/pda/suz/repo/scan';
          data = {
            repo_code : code,
            qr_code : qr_code
          }
        } else if (type == 'pallet') {
          url = '/pda/suz/pallet/scan';
          data = {
            pallet_code : code,
            qr_code : qr_code
          }
        } else {
          app.showErrorToast('只能扫卡板或仓库，客户端错误');
        }
        console.log(data)
        wx.request({
          url: app.globalData.serverUrl + url,
          header: {
            "content-type" : "application/json",
            "Authorization" : wx.getStorageSync('token_type')+" "+wx.getStorageSync('access_token')
          },
          method: "GET",
          dataType: 'json',
          data: data,
          success: (result) => {
            console.log(result)
            // http码
            if(result.statusCode == normalHttpCode) {
              // 业务状态码
              if (result.data.code == normalBusinessCode) {
                let data = result.data.data;
                // 把仓库编号加进去
                data.repo_code = code;
                if (type == 'repo') {
                  // 更新数据值
                  that.setData({
                    modalWarehouseData: data,
                    inWarehouseNumber: data.material_num,
                    title: title,
                    showCode: showCode,

                    showWarehouseModal: true,
                  })

                } else if (type == 'pallet') {
                  // 更新数据值
                  that.setData({
                    modalPalletsData: data,
                    inPalletsNumber: data.material_num,
                    title: title,
                    showCode: showCode,

                    showPalletsModal: true,
                  })
                } else {
                  app.showErrorToast('客服端错误501');
                } 

              } else {
                // 业务码判断打印错误
                app.processPostRequestConcreteCode(result.data.code, result.data.message);
              }
            } else {
              // 对code码进行校验并且处理
              app.processPostRequestStatusCode(result.statusCode);
            }
          },
          fail: (res) => {
            // app.requestSendError(res);
          },
          complete: (res) => {},
        })

      },
      fail: (res) => {
        console.log(`扫描失败`)
      }
    })
    
  },

  // 仓库扫描卡板 的提交动作
  postWarehouse(e) {
    console.log(this.data.modalWarehouseData);
    const action = this.data.modalWarehouseData.action;
    const repo_code = this.data.modalWarehouseData.repo_code;
    const pallet_code = this.data.modalWarehouseData.pallet_code;

    let url = ''
    let toastMsg = ''
    const that = this;
    // 判断是出库还是入库
    if (action == 'checkin') {
      url = '/pda/suz/repo/checkin';     // 入库的uri
      toastMsg = '入库成功'     // 入库的成功提示语
    } else if (action == 'checkout') {
      url = '/pda/suz/repo/checkout';
      toastMsg = '出库成功'
    } else {
      app.showErrorToast('后台错误，出入库类型错误')
      return;
    }
    const data = {
      repo_code: repo_code,
      pallet_code: pallet_code
    };
    console.log(data)
    // 发送请求提交
    wx.request({
      url: app.globalData.serverUrl + url,
      data: data,
      dataType: 'json',
      header: {
        "content-type": "application/json",
        "Authorization": wx.getStorageSync('token_type')+" "+wx.getStorageSync('access_token'),
      },
      method: 'POST',
      success: (result) => {
        // console.log(result);
        this.setData({
          inWarehouseNumber: 0,
        });
        app.processPostRequestStatusCode(result.statusCode);
        if (result.statusCode == normalHttpCode) {
          that.refreshData();
          app.showSuccessToast(toastMsg);
        }
      },
      fail: (res) => {
        app.showErrorToast("request请求发送失败");
      },
      complete: (res) => {},
    })

  },


  // 卡板扫描物料 的提交动作
  postPallets(e) {
    // console.log(e);
    const action = this.data.modalPalletsData.action;
    const pallet_code = this.data.modalPalletsData.pallet_code;
    const material_code = this.data.modalPalletsData.material_code;
    let material_num = this.data.modalPalletsData.material_num;
    
    let url = ''
    let toastMsg = ''
    let data = {};
    const that = this;
    // 判断是出库还是入库
    if (action == 'bind') {
      url = '/pda/suz/pallet/bind';     // 入库的uri
      toastMsg = '绑定成功'     // 入库的成功提示语
      // 绑定物料可以手动输入数量
      data= {
        pallet_code: pallet_code,
        material_code: material_code,
        material_num: this.data.inPalletsNumber,
      };
    } else if (action == 'unbind') {
      url = '/pda/suz/pallet/unbind';
      toastMsg = '解绑成功';
      data= {
        pallet_code: pallet_code,
        material_code: material_code,
        material_num: material_num
      };
    } else {
      app.showErrorToast("仅查看");
      return;
    }
    console.log(data);
    // 发送请求提交
    wx.request({
      url: app.globalData.serverUrl + url,
      data: data,
      dataType: 'json',
      header: {
        "content-type": "application/json",
        "Authorization": wx.getStorageSync('token_type')+" "+wx.getStorageSync('access_token'),
      },
      method: 'POST',
      success: (result) => {
        // console.log(result);
        app.processPostRequestStatusCode(result.statusCode);
        if (result.statusCode == normalHttpCode) {
          that.refreshData();
          app.showSuccessToast(toastMsg);
        }
      },
      fail: (res) => {
        app.showErrorToast("request请求发送失败");
      },
      complete: (res) => {},
    })

  },


  // modal层传来的cancel事件
  modalCancel() {
    console.log('material cancel');
  },

  // modal层传来的confirm事件
  modalConfirm() {
    // console.log('material confirm');
    wx.request({
      url: app.globalData.serverUrl + '/pda/suz/repo/checkin',
      data: {
        repo_code: this.data.repo_code,
        source: this.data.sourceArray[this.data.sourceIndex],
        material_code: this.data.material_code,
        material_num: this.data.material_num,
        work_code: '',
      },
      dataType: 'json',
      header: {
        "content-type": "application/json",
        "Authorization": wx.getStorageSync('token_type')+" "+wx.getStorageSync('access_token'),
      },
      method: 'post',
      success: (result) => {
        this.setData({
          inWarehouseNumber: 0,
        });
        app.processPostRequestStatusCode(result.statusCode);
        if (result.statusCode == normalHttpCode) {
          app.showSuccessToast("提交成功");
        }
      },
      fail: (res) => {
        app.showErrorToast("request请求发送失败");
      },
      complete: (res) => {},
    })
  },


  sourceChange: function(e) {
    // console.log(e)

    // 如果来源改变了，那么物料列表也需要改变
    let materialArray = [];
    let list = this.data.InWarehouseInfoArray[e.detail.value].material;
    for (const key in list) {
      materialArray.push(list[key].material_name);
    }
    // 获取物料数量
    let material_num = this.data.InWarehouseInfoArray[e.detail.value].material[0].material_num;
    // 物料码
    let material_code = this.data.InWarehouseInfoArray[e.detail.value].material[0].material_code
    this.setData({
      sourceIndex: e.detail.value,
      materialArray: materialArray,
      materialIndex: 0,
      material_num: material_num,
      material_code: material_code,
    })
  },
  materialChange: function(e) {

    let material_num = this.data.InWarehouseInfoArray[this.data.sourceIndex].material[e.detail.value].material_num;
    // 物料码
    let material_code = this.data.InWarehouseInfoArray[this.data.sourceIndex].material[e.detail.value].material_code;
    // console.log(material_num);
    this.setData({
      materialIndex: e.detail.value,
      material_num: material_num,
      material_code: material_code
    })
  },


  getInWarehouseNumInput(event) {
    this.setData({
      inWarehouseNumber: Number(event.detail.value)
    });
  },

  getInPalletsNumInput(event) {
    this.setData({
      inPalletsNumber: Number(event.detail.value)
    });
  }

})



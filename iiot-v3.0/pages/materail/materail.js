const app = getApp();

// pages/materail/materail.js
Page({

  data: {
    warehouseList: [],      // 仓库信息列表
    warehouseListIndex: 0,      
    palletsList:[],        // 卡板信息列表
    showModal: false,       // modal框控制位
    title: 'xxx',
    repo_code: 'xxx',
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
    
    selected_repo_code: '',
  },

  
  onShow: function (options) {
    this.getWarehouseList();
    this.getpalletsList();
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
          console.log(res.data)


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
        if(result.statusCode == 200) {
          // 业务状态码
          if (result.data.code == 0) {
            // app.showSuccessToast("成功");

            let list = [];
            for (const item of result.data.data) {
              item.onHide = 1;
              list.push(item);
            }

            // console.log(list);
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
        if(result.statusCode == 200) {
          // 业务状态码
          if (result.data.code == 0) {
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

  // // 点击入库按钮的动作
  // inWarehouse(event) {
  //   // console.log(event)
  //   const warehouseListIndex = event.currentTarget.dataset.index;
  //   console.log(warehouseListIndex)
  //   this.setData({
  //     showModal: true,
  //     warehouseListIndex: warehouseListIndex,
  //     title: this.data.warehouseList[warehouseListIndex].repo_name,
  //     repo_code: this.data.warehouseList[warehouseListIndex].repo_code
  //   });

  //   // 调用函数获取入库信息
  //   let repo_code = this.data.warehouseList[warehouseListIndex].repo_code
  //   this.getInWarehouseInfo(repo_code);
    
  // },

  // 点击入库按钮的动作
  inWarehouse(event) {
    const index = event.currentTarget.dataset.index;
    this.scanCode();
  },

  scanCode() {
    const that = this;
    wx.scanCode({
      success: (res) => {
        app.showErrorToast("未识别的信息");

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
        if (result.statusCode == 200) {
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
    // console.log('picker发送选择改变，携带值为', e.detail.value)
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

  getInWarehouseInfo(repo_code) {
    
    let that = this;
    wx.request({
      url: app.globalData.serverUrl + '/pda/suz/repo',
      header: {
        "content-type" : "application/json",
        "Authorization" : wx.getStorageSync('token_type')+" "+wx.getStorageSync('access_token')
      },
      data: {
        repo_code: repo_code
      },
      method: "GET",
      dataType: 'json',
      success: (result) => {
        // console.log(result);

        // http码
        if(result.statusCode == 200) {
          // 业务状态码
          if (result.data.code == 0) {
            // app.showSuccessToast("成功");

            // console.log(result.data.data)
            let sourceArray = [];
            let materialArray = [];
            // 修改sourceArray
            let list = result.data.data;
            for (const key in list) {
              // console.log(list[key].source);
              sourceArray.push(list[key].source);
            }
            // 修改materialArray （修改默认为第一项）
            list = result.data.data[0].material;
            for (const key in list) {
              materialArray.push(list[key].material_name);
            }
                // console.log(this.data.materialArray);
            // 修改material_num （修改默认为第一项）
            let material_num = result.data.data[0].material[0].material_num;
            // 物料码
            let material_code = result.data.data[0].material[0].material_code;
            that.setData({
              InWarehouseInfoArray: result.data.data,
              sourceArray: sourceArray,
              sourceIndex: 0,
              materialArray: materialArray,
              materialIndex: 0,
              material_num: material_num,
              material_code: material_code,
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

  getInWarehouseNumInput(event) {
    // console.log(event.detail.value);
    this.setData({
      inWarehouseNumber: Number(event.detail.value)
    });
  }

})



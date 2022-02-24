const app = getApp();

// pages/materail/materail.js
Page({

  data: {
    warehouseList: [],
    warehouseListIndex: 0,
    showModal: false,
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
    
  },

  
  onLoad: function (options) {
    this.getWarehouseList();
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
        console.log(result);

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
            console.log(list);
            that.setData({
              warehouseList: list,
            });
            console.log(that.data.warehouseList);
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
  unfold(event) {
    // console.log(event);
    const index = event.currentTarget.dataset.index;
    let list = this.data.warehouseList;
    // 将对应字典中的onHide标志位改变成0
    list[index].onHide = 0;
    this.setData({
      warehouseList: list,
    })
  },

  // 折叠信息
  flod(event) {
    // console.log(event);
    const index = event.currentTarget.dataset.index;
    let list = this.data.warehouseList;
    // 将对应字典中的onHide标志位改变成0
    list[index].onHide = 1;
    this.setData({
      warehouseList: list,
    })
  },

  // 点击入库按钮的动作
  inWarehouse(event) {
    // console.log(event)
    const warehouseListIndex = event.currentTarget.dataset.index;
    console.log(warehouseListIndex)
    this.setData({
      showModal: true,
      warehouseListIndex: warehouseListIndex,
      title: this.data.warehouseList[warehouseListIndex].repo_name,
      repo_code: this.data.warehouseList[warehouseListIndex].repo_code
    });

    // 调用函数获取入库信息
    let repo_code = this.data.warehouseList[warehouseListIndex].repo_code
    this.getInWarehouseInfo(repo_code);
    
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



// pages/component/modal/modal.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    //是否显示modal
    show: {
      type: Boolean,
      value: false
    },
    //modal的高度
    height: {
      type: String,
      value: '80%'
    },
    // title
    title: {
      type: String,
      value: 'title'
    },
    // 编号
    showCode: {
      type: String,
      value: 'xxx'
    },
    // 在仓库数组中的下标（用户点击的是哪一项）
    index: {
      type: Number,
      value: 0
    }

  
  },

  /**
   * 组件的初始数据
   */
  data: {

  },
  /**
   * 组件的方法列表
   */
  methods: {
    clickMask() {
      // this.setData({show: false})
     },
    
     cancel() {
      this.setData({ show: false })
      // console.log(this.properties.index)
      
      // triggerEvent用来控制触发调用处的函数
      this.triggerEvent('cancel')
     },
    
     confirm() {
      this.setData({ show: false })
      this.triggerEvent('confirm')
     },


     // 获取到入库信息
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
            if (result.data.code == 200) {
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
          app.requestSendError(res);
        },
        complete: (res) => {},
      })
    },
  
    getInWarehouseNumInput(event) {
      // console.log(event.detail.value);
      this.setData({
        inWarehouseNumber: Number(event.detail.value)
      });
    },

    // 修改来源
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

    // 修改物料
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
 



  }
})

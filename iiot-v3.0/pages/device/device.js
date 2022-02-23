const app = getApp();
// pages/device/device.js
Page({

  data: {
    taskList:[],
    taskListIndex: 0,

    showModal: false,
    machine_code: 'xxx',
    title: '123'
  },

  
  onShow: function (options) {
    // console.log("123");
    this.getTaskList();
  },

  getTaskList() {
    let that = this;
    wx.request({
      url: app.globalData.serverUrl + '/pda/suz/tasks'+ '/' +wx.getStorageSync('emp_code'),
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
          if (result.data.code == 200) {
            // app.showSuccessToast("成功");

            let list = [];
            for (const item of result.data.data) {
              item.onHide = 1;
              list.push(item);
            }
            console.log(list);
            that.setData({
              taskList: list,
            });
            console.log(that.data.taskList);
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

  // 展开折叠信息
  unfold(event) {
    // console.log(event);
    const index = event.currentTarget.dataset.index;
    let list = this.data.taskList;
    // 将对应字典中的onHide标志位改变成0
    list[index].onHide = 0;
    this.setData({
      taskList: list,
    })
  },

  // 折叠信息
  flod(event) {
    // console.log(event);
    const index = event.currentTarget.dataset.index;
    let list = this.data.taskList;
    // 将对应字典中的onHide标志位改变成0
    list[index].onHide = 1;
    this.setData({
      taskList: list,
    })
  },

  // 弹出modal框
  popModal(event) {
    // console.log(event)
    const taskListIndex = event.currentTarget.dataset.index;
    // console.log(taskListIndex)
    this.setData({
      showModal: true,
      taskListIndex: taskListIndex,
      title: this.data.taskList[taskListIndex].machine_name,
      machine_code: this.data.taskList[taskListIndex].machine_code
    });

  },

  // modal层传来的cancel事件
  modalCancel() {
    console.log('material cancel');
  },

  // modal层传来的confirm事件
  modalConfirm() {

  }

})
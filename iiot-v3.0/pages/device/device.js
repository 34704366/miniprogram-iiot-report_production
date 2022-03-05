const app = getApp();
// 良品报数的函数控制标志位
const REPORT_PASS = 1;
// 残次品报数的函数控制标志位
const REPORT_DEFECT = 2;
// 修改员工状态的函数控制标志位
const CHANGE_OPREATOR_STATUS = 3;
Page({

  data: {
    taskList:[],
    taskListIndex: 0,

    showModal: false,
    machine_code: 'xxx',
    title: '123',

    // passNumber: 0,
    machine_status_obj: {
      "1": "设备预热",
      "2": "设备试生产",
      "3": "设备生产循环",
      "4": "设备清洗",
    },
    statusIndex: 0,
    inWarehouseNumber: 0,
  },

  
  onShow: function (options) {
    // console.log("123");
    this.getTaskList();
    // this.judgeOpreatorStatus();
    
  },

  getTaskList() {
    let that = this;
    wx.request({
      // url: app.globalData.serverUrl + '/pda/suz/tasks'+ '/' +wx.getStorageSync('emp_code'),
      url: app.globalData.serverUrl + '/pda/suz/tasks',
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
            // let inDuty = false;
            // let offDuty = false;
            for (const item of result.data.data) {
              item.onHide = 1;  // 添加标志位
              item.passNumber = 0;    // 添加用户输入的良品报数数量
              item.defectNumber = 0;    // 添加用户输入的次品报数数量、
              // 判断员工状态
              // let inDuty = false;
              let {inDuty,offDuty} = this.judgeOpreatorStatus(item.operator_status);
              // console.log('in:',inDuty,'off:',offDuty);
              item.inDuty = inDuty;
              item.offDuty = offDuty;

              let machine_status_obj = {
                "1": "设备预热",
                "2": "设备试生产",
                "3": "设备生产循环",
                "4": "设备清洗",
              }
              // item.machine_status_obj = machine_status_obj;
              let machine_status_array = [];
              let machine_status_index = [];
              for (const index in item.machine_status_obj) {
                // console.log(machine_status_obj[index]);
                machine_status_array.push(item.machine_status_obj[index]);
                machine_status_index.push(index);
              }
              item.machine_status_array = machine_status_array;
              item.machine_status_index = machine_status_index;
              item.statusIndex = 0;

              // 判断任务状态
              if (item.task_status == "未启动") {
                item.task_button_text = "启动";
                item.button_disabled = false;
              } else if (item.task_status == "进行中") {
                item.task_button_text = "完成"
                item.button_disabled = false;
              } 
              else {
                item.task_button_text = item.task_status;
                item.button_disabled = true;
              }

              list.push(item);
            }
            // console.log(list);
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
    const id = event.currentTarget.dataset.id;
    // console.log(taskListIndex)
    this.setData({
      showModal: true,
      taskListIndex: taskListIndex,
      title: this.data.taskList[taskListIndex].machine_name,
      machine_code: this.data.taskList[taskListIndex].machine_code
    });
    if (id == '1' || id == 1) {  
      // 调用函数获取入库信息
      let repo_code = this.data.taskList[taskListIndex].repo_A_code
      this.getInWarehouseInfo(repo_code);
    }
    else if (id == '2' || id == 2) {
      // 调用函数获取入库信息
      let repo_code = this.data.taskList[taskListIndex].repo_B_code
      this.getInWarehouseInfo(repo_code);
    }

  },

  // modal层传来的cancel事件
  modalCancel() {
    console.log('material cancel');
  },

  // modal层传来的confirm事件
  modalConfirm() {
    console.log('material confirm');
    const that = this;
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
          that.onShow();
        }
      },
      fail: (res) => {
        app.showErrorToast("request请求发送失败");
      },
      complete: (res) => {},
    })
  },

  // 获取输入框内数字
  getPassNumInput(event) {
    // console.log(event);
    const number = Number(event.detail.value)
    const taskListIndex = event.currentTarget.dataset.index;
    let list = this.data.taskList;
    list[taskListIndex].passNumber = number;
    this.setData({
      taskList: list,
    });
  },

  // 获取输入框输入
  getDefectNumInput(event) {
    // console.log(event);
    const number = Number(event.detail.value)
    const taskListIndex = event.currentTarget.dataset.index;
    let list = this.data.taskList;
    list[taskListIndex].defectNumber = number;
    this.setData({
      taskList: list,
    });
  },

  // 判断员工状态
  judgeOpreatorStatus(status) {
    // 离岗
    if(status == 2 || status == 4) {
      return {
        inDuty: false,
        offDuty: true
      };
    }
    // 在岗
    else if(status == 3 || status == 1) {
      return {
        inDuty: true,
        offDuty: false
      }
    } 
    else {
      return {
        inDuty: false,
        offDuty: true
      }
    }

  },

  // 修改人员状态
  changeOpreatorStatus(e){
    // 先判断对应的任务是不是还没有启动
    // const machine_status = this.data.machine_status;
    // if (machine_status == 0 || machine_status == '0') {
    //   app.showErrorToast("该设备对应的任务还没有启动");
    //   return;
    // }

    // console.log(e.detail.value);
    const index = e.currentTarget.dataset.index;
    const status = e.detail.value;
    const url = app.globalData.serverUrl + "/pda/suz/task/operator";
    const data = {
      machine_code: this.data.taskList[index].machine_code,
      work_order: this.data.taskList[index].work_code,
      operator_status: status,
      task_code: this.data.taskList[index].task_code,
    }
    // console.log(e);
    this.deivcePostRequest(url, data, "修改成功", CHANGE_OPREATOR_STATUS, index);
  },

  // 修改设备状态
  statusChange(e) {
    const index = e.currentTarget.dataset.index;
    let list = this.data.taskList;
    list[index].statusIndex = e.detail.value;
    this.setData({
      taskList: list,
    });
    
    // 发送修改设备状态的请求
    const url = app.globalData.serverUrl + "/pda/suz/task/machine";
    console.log(url)
    const data = {
      machine_code: this.data.taskList[index].machine_code,
      work_order: this.data.taskList[index].work_code,
      machine_status: this.data.taskList[index].machine_status_index[e.detail.value],
      task_code: this.data.taskList[index].task_code,
    }
    this.taskRequest(url, data);
    
  },
  
  // 良品报数
  passSubmit(e) {
    // 如果数量为0，不发送请求
    const index = e.currentTarget.dataset.index;
    const number = this.data.taskList[index].passNumber;
    const url = app.globalData.serverUrl + "/pda/suz/task/pass";
    if (number <= 0) {
      app.showErrorToast('请输入大于0的整数');
      return
    }

    // 添加蒙层阻止连续点击
    wx.showLoading({
      title: '数据加载中',
      mask: true,
      complete(res) {
        console.log(res);
      }
    })
    const data = {
      machine_code: this.data.taskList[index].machine_code,
      work_order: this.data.taskList[index].work_code,
      quantity: number,
      task_code: this.data.taskList[index].task_code,
    }
    this.deivcePostRequest(url, data, "报数成功", REPORT_PASS, index);

    // // 检验数据合法性

    // if (this.isAllowed(this.data.passReportNumber)) {
      // this.deivcePostRequest(url, data, "报数成功", REPORT_PASS, index);
    // }
    // else {
    //   this.setData({
    //     passReportNumber: '',
    //   });
    // }
  },

  // 次品报数
  defectSubmit(e) {
    const index = e.currentTarget.dataset.index;
    const number = this.data.taskList[index].defectNumber;
    const url = app.globalData.serverUrl + "/pda/suz/task/defect";
    if (number <= 0) {
      app.showErrorToast('请输入大于0的整数');
      return
    }
    const data = {
      machine_code: this.data.taskList[index].machine_code,
      work_order: this.data.taskList[index].work_code,
      quantity: number,
      task_code: this.data.taskList[index].task_code,
    }
    this.deivcePostRequest(url, data, "报数成功", REPORT_DEFECT, index);
  },

  // 统一post请求
  deivcePostRequest(url, data, showTitle, flag, index) {
    // 返回值
    const that = this;
    wx.request({
      url: url,
      data: data,
      dataType: 'json',
      header: {
        "content-type" : "application/json",
        "Authorization" : wx.getStorageSync('token_type')+" "+wx.getStorageSync('access_token')
      },
      method: 'POST',
      success: (result) => {
        // console.log(result);
        // console.log(data);
        app.processPostRequestStatusCode(result.statusCode);
        if(result.statusCode == 200) {
          app.showSuccessToast(showTitle);
          
          // 如果是良品报数
          if(flag == REPORT_PASS) {
            let list = this.data.taskList;
            list[index].pass_reported = parseInt(that.data.taskList[index].pass_reported) + parseInt(that.data.taskList[index].passNumber);
            list[index].passNumber = 0;
            // 添加到已报良品数量上
            that.setData({
              taskList: list,
            });
            // console.log("修改后良品数量:",this.data.pass_reported);
          }
          // 如果是残次品报数
          else if (flag == REPORT_DEFECT) {
            let list = this.data.taskList;
            list[index].defect_reported = parseInt(that.data.taskList[index].defect_reported) + parseInt(that.data.taskList[index].defectNumber);
            list[index].defectNumber = 0;
            // 添加
            that.setData({
              taskList: list,
            });
          }
          // 如果是修改人员状态
          else if (flag == CHANGE_OPREATOR_STATUS) {}
          // 异常
          else {}
        }
        
      },
      fail: (res) => {
        app.showErrorToast("发送request请求失败");
        
        // return -1;
        that.result = -1;
      },
      complete: (res) => {
        wx.hideLoading({
          success: (res) => {},
        }) 
      },
    });
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

  // 任务启动或者结束
  taskStartOrEnd(e) {

    const index = e.currentTarget.dataset.index;
    // 判断任务状态
    const taskStatus = this.data.taskList[index].task_status;
    if (taskStatus == "未启动") {
      const url = app.globalData.serverUrl + "/pda/suz/task/start";
      // console.log(url);
      const data = {
        task_code: this.data.taskList[index].task_code,
      }


      console.log(data)
      // 发送post请求
      this.taskRequest(url, data);
      
    } else if (taskStatus == "进行中") {
      const url = app.globalData.serverUrl + "/pda/suz/task/end";
      const data = {
        task_code: this.data.taskList[index].task_code,
      }
      console.log(data);
      // 发送post请求
      this.taskRequest(url, data);
    }

  },

  // 任务开始或者任务结束的request请求
  taskRequest(url, data) {
    console.log('11')
    let that = this;
    wx.request({
      url: url,
      data: data,
      header: {
        "content-type" : "application/json",
        "Authorization" : wx.getStorageSync('token_type')+" "+wx.getStorageSync('access_token')
      },
      method: "post",
      dataType: 'json',
      success: (result) => {
        console.log(result);

        // http码
        if(result.statusCode == 200) {
          // 业务状态码
          if (result.data.code == 0) {
            app.showSuccessToast("成功");
            // 页面重新渲染
            that.onShow();
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
      complete: (res) => {
        // console.log(res);
      },
    })
  },

})
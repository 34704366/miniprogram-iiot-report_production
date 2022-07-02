const app = getApp();

const normalHttpCode  = app.globalData.normalHttpCode;
const normalBusinessCode = app.globalData.normalBusinessCode;

// 良品报数的函数控制标志位
const REPORT_PASS = 1;
// 残次品报数的函数控制标志位
const REPORT_DEFECT = 2;
// 修改员工状态的函数控制标志位
const CHANGE_OPREATOR_STATUS = 3;

// 报产标志位
const TEST_REPORT = 300;    // 调机报产
const PASS_REPORT = 301;    // 良品报产
const DEFECT_REPORT = 302;  // 次品报产

const FAULT_REPORT = 304;   // 故障上报
const CHANGE_DEVICE_STATUS_REPORT = 305;   // 修改设备状态


Page({

  data: {
    taskList:[],
    taskListIndex: 0,

    fixList: [],
    fixListIndex: 0,

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
    selected_machine_code: '',

    modalInOutWarehouseData: {},    // 出/入库数据存放

    reportNumber: "",   // 报产数量
    showReportModal: false,   // 报产modal控制位
    isDefectReportFlag: false,   // 控制是否是次品报产的控制位

    defectReasonArray: [],   // 次品原因，从后台拉取
    defectReasonIndex: 0,   // 
    defectReasonValueArray: [],   // 次品原因对应的int值
    defectReasonValueIndex: 0,  
    defectReasonText: '',   // 手写项原因
    changeDeviceStatusReasonText: '',    // reason
    faultReportStatusReasonText: '',   // reason

    showChangeDeviceStatusModal: false,
    machineStatusModalData: {},
    postDeviceStatusValue: 0,

    showFaultReportModal: false,
  },
  onLoad: function (options) {
    this.refreshData();
  },
  
  onShow: function (options) {
    // 获取设备列表
    // this.refreshData();

    const that = this;
    // this.judgeOpreatorStatus();


    wx.getStorage({
      key: 'machine_code',
      success(res) {
        if (res.data) {
          // 放入appData中,然后请求设备列表的回调函数会去判断这个字段是否为空
          // 如果不为空，就将该信息展开
          that.setData({
            selected_machine_code: res.data
          })
          console.log(res.data)


          // 拿到machine_code以后从缓存删除掉
          wx.removeStorage({
            key: 'machine_code',
          })
        } 
      },
      fail(res) {
        that.setData({
          selected_machine_code: '',
        })
      }
    })
    
  },


  // 刷新页面重新拉取数据
  refreshData() {
    // 获取设备列表
    this.getTaskList();
    this.getFixList();
  },

  // 获取task列表
  getTaskList() {
    let that = this; 
    wx.request({
      // url: app.globalData.serverUrl + '/pda/suz/tasks'+ '/' +wx.getStorageSync('emp_code'),

      // url: app.globalData.serverUrl + '/pda/suz/tasks',
      url: app.globalData.serverUrl + '/pda/suz/production-plan',

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
            const oldTaskList = that.data.taskList;
            // console.log(oldTaskList);
            // app.showSuccessToast("成功");
            console.log(result.data.data);
            let list = [];
            // let inDuty = false;
            // let offDuty = false;
            for (const item of result.data.data) {

              // 判断是否折叠
              item.onHide = 1;  // 添加标志位
              for (const oldItem of oldTaskList) {
                if (oldItem.task_code == item.task_code) {
                  if (oldItem.onHide == 0) {
                    item.onHide = oldItem.onHide;
                  }
                }
              }

              // 判断员工状态
              // let inDuty = false;
              let {inDuty,offDuty} = this.judgeOpreatorStatus(item.operator_status);
              // console.log('in:',inDuty,'off:',offDuty);
              item.inDuty = inDuty;
              item.offDuty = offDuty;

              // 对机器状态数据进行清洗

              let machine_status_array = [];
              let machine_status_index = [];
              item.deviceNowStatus = '修改设备状态'   // 如果出现异常（找不到设备当前状态对应的全部状态中的值），则显示该文字
              for (const index in item.machine_status_obj) {
                for (const i in item.machine_status_obj[index].status) {
                  // 取得具体某一项的状态
                  const status = item.machine_status_obj[index].status;
                  // 取得value
                  const value = status[i];
                  // radio是否选中的标志位
                  let isChecked = false;
                  // 判断是不是现在机器的状态
                  if (String(value) == String(item.machine_status)) {
                    // 如果是当前机器的状态，那么radio选中
                    isChecked = true;
                    // 将设备状态显示文字换为索引值（传来的索引是文字）
                    item.deviceNowStatus = i;
                  }
                  // 修改数据的结构
                  status[i] = {
                    'value': value,
                    'isChecked': isChecked
                  }
                  // console.log(item.machine_status_obj[index].status[i])
                }
                // console.log(machine_status_obj[index]);
              }


              // 判断任务状态
              if (item.task_status == "未启动") {
                item.task_button_text = "启动";
                // 按钮是否禁用
                item.button_disabled = true;
                // 启动任务按钮是否禁用
                item.task_button_disabled = false;
              } else if (item.task_status == "进行中") {
                item.task_button_text = "完成"
                item.button_disabled = false;
                item.task_button_disabled = false;
              } 
              else {
                item.task_button_text = item.task_status;
                item.button_disabled = true;
                item.task_button_disabled = true;
              }
          

              list.push(item);
            }
            // console.log(list);
            that.setData({
              taskList: list,
            });
            

            // 判断是否有machine_code(是否是由扫码跳转而来)
            const machine_code = that.data.selected_machine_code;
            if (machine_code != '') {
              // 判断列表里面有没有
              for (const item of list) {
                if (item.machine_code == machine_code) {
                  item.onHide = 0;
                }
              }
              that.setData({
                taskList: list,
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

  getFixList(){
    const that = this;
    wx.request({

      // url: app.globalData.serverUrl + '/pda/suz/tasks',
      url: app.globalData.serverUrl + '/pda/suz/fix-plan',

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
            // 获取刷新之前的维修计划列表
            const oldFixList = that.data.fixList;
            const data = result.data.data;
            let list = [];
            for (let item of data) {

              item.onHide = 1;  // 添加标志位
              // 判断是否折叠
              for (const oldItem of oldFixList) {
                if (oldItem.task_code == item.task_code) {
                  if (oldItem.onHide == 0) {
                    item.onHide = oldItem.onHide;
                  }
                }
              }

              // 判断任务状态
              if (item.task_status == "未启动") {
                item.task_button_text = "启动";
                item.button_disabled = true;
                item.task_button_disabled = false;
              } else if (item.task_status == "进行中") {
                item.task_button_text = "完成"
                item.button_disabled = false;
                item.task_button_disabled = false;
              } 
              else {
                item.task_button_text = item.task_status;
                item.button_disabled = true;
                item.task_button_disabled = true;
              }

              list.push(item);
            }
            // console.log(list);
            that.setData({
              fixList: list,
            })

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
  unfoldTask(event) {
    // console.log(event);
    const index = event.currentTarget.dataset.index;
    let list = this.data.taskList;
    // 将对应字典中的onHide标志位改变成0
    list[index].onHide = 0;
    this.setData({
      taskList: list,
    })
  },

  // 展开折叠信息
  unfoldFix(event) {
    // console.log(event);
    const index = event.currentTarget.dataset.index;
    let list = this.data.fixList;
    // 将对应字典中的onHide标志位改变成0
    list[index].onHide = 0;
    this.setData({
      fixList: list,
    })
  },

  // 折叠信息
  flodTask(event) {
    // console.log(event);
    const index = event.currentTarget.dataset.index;
    let list = this.data.taskList;
    // 将对应字典中的onHide标志位改变成0
    list[index].onHide = 1;
    this.setData({
      taskList: list,
    })
  },

  // 折叠信息
  flodFix(event) {
    // console.log(event);
    const index = event.currentTarget.dataset.index;
    let list = this.data.fixList;
    // 将对应字典中的onHide标志位改变成0
    list[index].onHide = 1;
    this.setData({
      fixList: list,
    })
  },


  // modal层传来的cancel事件
  modalCancel() {
    console.log('material cancel');
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
    const that = this;
    const url = app.globalData.serverUrl + "/pda/suz/production/operator";
    const data = {
      machine_code: this.data.taskList[index].machine_code,
      work_order: this.data.taskList[index].work_code,
      status: status,
      task_code: this.data.taskList[index].task_code,
    }
    console.log(data);

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
        app.processPostRequestStatusCode(result.statusCode);
        if(result.statusCode == normalHttpCode) {
          if (result.data.code == normalBusinessCode) {
            app.showSuccessToast('上报成功');
            that.refreshData();
          }
          else {
            app.showErrorToast('后台错误：',result.data.message);
          }
        
        }
        
      },
      fail: (res) => {
        app.showErrorToast("本地网络故障");
        
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
  
  testReportClick(event) {
    const index = event.currentTarget.dataset.index;
    const type = TEST_REPORT;   // 报产标志位--调机
    const machine_code = event.currentTarget.dataset.machine_code;
    const work_order = event.currentTarget.dataset.work_order;
    const task_code = event.currentTarget.dataset.task_code;

    const title = event.currentTarget.dataset.title;   // 显示在modal上的title
    const showCode = event.currentTarget.dataset.showCode;  // 显示在modal上的code

    this.setData({
      showReportModal: true,
      reportModalText: '调机报数',
      reportType: type,
      taskListIndex: index,
      machine_code: machine_code,    // post-data
      work_order: work_order ,      // post-data
      task_code: task_code,      // post-data
      reportNumber: '',

      isDefectReportFlag: false,     // 负责让次品报产modal多一行信息的控制位
      title: title,
      showCode: showCode,
    })
  },

  // 点击良品报产事件回调函数
  passReportClick(event) {
    const index = event.currentTarget.dataset.index;
    const type = PASS_REPORT;  // 报产标志位--调机
    const machine_code = event.currentTarget.dataset.machine_code;
    const work_order = event.currentTarget.dataset.work_order;
    const task_code = event.currentTarget.dataset.task_code;

    const title = event.currentTarget.dataset.title;   // 显示在modal上的title
    const showCode = event.currentTarget.dataset.showCode;  // 显示在modal上的code

    this.setData({
      showReportModal: true,
      reportModalText: '良品报数',
      reportType: type,
      taskListIndex: index,

      machine_code: machine_code,    // post-data
      work_order: work_order ,      // post-data
      task_code: task_code,      // post-data
      reportNumber: '',

      isDefectReportFlag: false,     // 负责让次品报产modal多一行信息的控制位
      title: title,
      showCode: showCode,

      defectReasonText: ''
    })
  },

  // 点击次品报产事件回调函数
  defectReportClick(event) {
    const index = event.currentTarget.dataset.index;   // index
    const type = DEFECT_REPORT;   // 报产标志位--调机
    const machine_code = event.currentTarget.dataset.machine_code;
    const work_order = event.currentTarget.dataset.work_order;
    const task_code = event.currentTarget.dataset.task_code;

    const title = event.currentTarget.dataset.title;   // 显示在modal上的title
    const showCode = event.currentTarget.dataset.showCode;  // 显示在modal上的code
    console.log(`click: data: ${machine_code, work_order, task_code}`)
    this.setData({
      showReportModal: true,
      reportModalText: '次品报数',
      reportType: type,
      taskListIndex: index,

      machine_code: machine_code,    // post-data
      work_order: work_order ,      // post-data
      task_code: task_code,      // post-data
      reportNumber: '',

      isDefectReportFlag: true,     // 负责让次品报产modal多一行信息的控制位
      title: title,
      showCode: showCode,

      defectReasonText: '',
    })
    
    // 提取出该任务对应的次品原因
    const defect_reason = this.data.taskList[index].defect_reason_obj;
    let keyList = [];
    let valueList = [];
    for (const index in defect_reason) {
      keyList.push(index);
      valueList.push(defect_reason[index]);
    }
    console.log(keyList);
    console.log(valueList);
    this.setData({
      defectReasonArray: keyList,
      defectReasonValueArray: valueList
    })
  },

  defectReasonChange(e) {
    const index = e.detail.value;
    this.setData({
      defectReasonIndex: index,
      defectReasonValueIndex: index,
    })
  },

  // 报产post请求
  postReport(event) {
    const type = this.data.reportType;
    const machine_code = this.data.machine_code;
    const work_order = this.data.work_order;
    const task_code = this.data.task_code;
    const quantity = this.data.reportNumber;
    const index = this.data.taskListIndex;


    // 判断数量是否合法
    if (quantity <= 0) {
      app.showErrorToast('请输入大于0的数量1231231313123131313');
      return '-1';
    }

    let url = '';
    let data = {};
    if (type == TEST_REPORT) {
      url = '/pda/suz/production/test';
      data = {
        machine_code: machine_code,
        work_order: work_order,
        task_code: task_code,
        quantity: quantity
      }
    } else if (type == PASS_REPORT) {
      url = '/pda/suz/production/pass';
      data = {
        machine_code: machine_code,
        work_order: work_order,
        task_code: task_code,
        quantity: quantity
      }
    } else if (type == DEFECT_REPORT) {
      url = '/pda/suz/production/defect';
      const reason = this.data.defectReasonValueArray[this.data.defectReasonValueIndex];    // 原因的value 
      const param = this.data.defectReasonText;
      data = {
        machine_code: machine_code,
        work_order: work_order,
        task_code: task_code,
        quantity: quantity,
        reason: reason,
        param: param
      }
    } else {
      app.showErrorToast('客服端错误504');
      return;
    }

    console.log('report data:::',data);
    this.postReportInterface(url, data, type, index)
  },

  // 报产统一post请求接口
  postReportInterface(url, data, type, index) {
    
    // 返回值
    const that = this;
    wx.request({
      url: app.globalData.serverUrl + url,
      data: data,
      dataType: 'json',
      header: {
        "content-type" : "application/json",
        "Authorization" : wx.getStorageSync('token_type')+" "+wx.getStorageSync('access_token')
      },
      method: 'POST',
      success: (result) => {
        app.processPostRequestStatusCode(result.statusCode);
        if(result.statusCode == normalHttpCode) {
          if(result.data.code == normalBusinessCode) {
            
            // 刷新数据
            that.refreshData();
            // 将几种情况分开，以防止之后有新改动
            
            // 如果是调机报产
            if(type == TEST_REPORT) {
              app.showSuccessToast('调机报产成功');
            }
            // 如果是良品报产
            else if (type == PASS_REPORT) {
              app.showSuccessToast('良品报产成功');
              
            }
            // 如果是次品报产
            else if (type == DEFECT_REPORT) {
              app.showSuccessToast('次品报产成功');
              
            }
            else if (type == FAULT_REPORT) {
              app.showSuccessToast('故障上报成功');
            }
            // 如果是设备状态修改
            else if (type == CHANGE_DEVICE_STATUS_REPORT) {
              app.showSuccessToast('修改状态成功');
            }
            // 异常
            else {
              app.showErrorToast('505客户端错误');
            }
          } else {
            app.showErrorToast(result.data.message);
          }
        } else {
          app.showErrorToast(result.errMsg);
        }
        
      },
      fail: (result) => {
        app.showErrorToast("本地网络故障");
        console.log(result)
        
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

  // 故障上报按钮的点击回调函数
  faultReportClick(event) {
    const index = event.currentTarget.dataset.index;   // index

    const machine_code = event.currentTarget.dataset.machine_code;
    const work_order = event.currentTarget.dataset.work_order;
    const task_code = event.currentTarget.dataset.task_code;

    const title = event.currentTarget.dataset.title;   // 显示在modal上的title
    const showCode = event.currentTarget.dataset.showCode;  // 显示在modal上的code
    
    const machine_status = this.data.taskList[index].machine_status_obj;
    let fault_status = [];
    // 取得设备的全部故障信息
    for(let key in machine_status) {
      // 如果是故障类型，设备全部状态中该项的is_fault的值为1
      if (machine_status[key].is_fault == 1 || machine_status[key].is_fault == '1') {
        fault_status.push(machine_status[key]);
        
      }
    }

    this.setData({
      showFaultReportModal: true,
      taskListIndex: index,

      machine_code: machine_code,    // post-data
      work_order: work_order ,      // post-data
      task_code: task_code,      // post-data

      // 显示在modal框上的信息
      title: title,
      showCode: showCode,

      // 显示在modal框上的故障类型信息
      faultStatusModalData: fault_status,
      faultReportStatusReasonText: ''
    })

  },

  // 修改设备状态的radio按钮修改的事件回调
  changeFaultStatusRadioClick(event) {
    // 获取状态的value
    const status_value = event.detail.value;

    this.setData({
      postFaultStatusValue: status_value
    })
  },


  // modal框提交fault report
  postFaultReport(event) {
    const status = this.data.postFaultStatusValue;

    // post-data
    const machine_code = this.data.machine_code;
    const work_order = this.data.work_order;
    const task_code = this.data.task_code;

    const param = this.data.faultReportStatusReasonText;
    let start_time = this.data.faultReportStartTime;
    let end_time = this.data.faultReportEndTime;
    
    // 日期不能为空
    if (!start_time || !end_time) {
      app.showErrorToast('日期不能为空');
      console.log('日期为空')
      return;
    } 

    // 拼接上日期
    let date = new Date(new Date()).toLocaleDateString();
    date = date.replace(/\//g , '-');   // 日期中/替换成-
    start_time = date + ' ' + start_time + ':00';
    end_time = date + ' ' + end_time + ':00';

    // 提交的数据
    const data = {
      machine_code: machine_code,
      work_order: work_order,
      task_code: task_code,
      status: status,
      param: param,
      start_time: start_time,
      end_time: end_time
    }
    const url = '/pda/suz/production/fault';
    const type = FAULT_REPORT;
    console.log(data)
    this.postReportInterface(url, data, type);
  },

  // 设备状态调整的点击回调函数
  changeDeviceStatusClick(event) {
    const index = event.currentTarget.dataset.index;   // index

    const machine_code = event.currentTarget.dataset.machine_code;
    const work_order = event.currentTarget.dataset.work_order;
    const task_code = event.currentTarget.dataset.task_code;

    const title = event.currentTarget.dataset.title;   // 显示在modal上的title
    const showCode = event.currentTarget.dataset.showCode;  // 显示在modal上的code


    // 设备的全部状态
    const machineStatusModalData = this.data.taskList[index].machine_status_obj;

    this.setData({
      showChangeDeviceStatusModal: true,
      taskListIndex: index,

      machine_code: machine_code,    // post-data
      work_order: work_order ,      // post-data
      task_code: task_code,      // post-data

      title: title,
      showCode: showCode,

      machineStatusModalData: machineStatusModalData,
      changeDeviceStatusReasonText: '',
    })
  },

  // 修改设备状态的radio按钮修改的事件回调
  changeDeviceStatusRadioClick(event) {
    // 获取状态的value
    const status_value = event.detail.value;

    this.setData({
      postDeviceStatusValue: status_value
    })
    console.log(status_value)
  },

  // 修改设备状态modal框提交
  postDeviceStatusChange(event) {
    const status = this.data.postDeviceStatusValue;

    // post-data
    const machine_code = this.data.machine_code;
    const work_order = this.data.work_order;
    const task_code = this.data.task_code;

    const param = this.data.changeDeviceStatusReasonText;

    const data = {
      status: status,
      machine_code: machine_code,
      work_order: work_order,
      task_code: task_code,
      param: param
    }
    
    const url = '/pda/suz/production/machine';
    const type = CHANGE_DEVICE_STATUS_REPORT;

    this.postReportInterface(url, data, type);
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
    const type = e.currentTarget.dataset.type;

    let objectList = [];

    let task_type = '';

    if (type == 'production') {
      objectList = this.data.taskList;

    } else if (type == 'fix') {
      objectList = this.data.fixList;
    } else {
      app.showErrorToast('提交类型错误');
      return;
    }
    // console.log(type)

    // 判断任务状态
    const taskStatus = objectList[index].task_status;
    if (taskStatus == "未启动") {
      const url = app.globalData.serverUrl + "/pda/suz/task/start";
      // console.log(url);
      const data = {
        task_code: objectList[index].task_code,
        task_type: type,
      }


      console.log(data)
      // 发送post请求
      this.taskRequest(url, data);
      
    } else if (taskStatus == "进行中") {
      const url = app.globalData.serverUrl + "/pda/suz/task/end";
      const data = {
        task_type: type,
        task_code: objectList[index].task_code,
      }
      // console.log(data);
      // 发送post请求
      this.taskRequest(url, data);
    } else {
      console.log('后端传来的任务状态既不是未启动也不是进行中，可能又换词了');
      app.showErrorToast('客户端错误505');
    }

  },


  // 任务开始或者任务结束的request请求
  taskRequest(url, data) {
    let that = this;
    console.log(data)
    wx.request({
      url: url,
      data: data,
      header: {
        "content-type" : "application/json",
        "Authorization" : wx.getStorageSync('token_type')+" "+wx.getStorageSync('access_token')
      },
      method: "POST",
      dataType: 'json',
      success: (result) => {
        console.log(result);

        // http码
        if(result.statusCode == normalHttpCode) {
          // 业务状态码
          if (result.data.code == normalBusinessCode) {
            app.showSuccessToast("成功");
            // 页面重新渲染
            that.refreshData();
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

  // 入库事件回调函数
  inWarehouseClick(event) {
    const index = event.currentTarget.dataset.index;
    const machine_code = event.currentTarget.dataset.machine_code;
    const work_code = event.currentTarget.dataset.work_code;
    const task_code = event.currentTarget.dataset.task_code;
    const action = 'checkin'   // 入库标志位
    const title = event.currentTarget.dataset.title;   // 显示在modal上的title
    const showCode = event.currentTarget.dataset.showCode;  // 显示在modal上的code

    this.setData({
      taskListIndex: index,
    })

    this.scanCode(action, machine_code, work_code, task_code, title, showCode);

  },

  // 出库事件回调函数
  outWarehouseClick(event) {
    const index = event.currentTarget.dataset.index;
    const machine_code = event.currentTarget.dataset.machine_code;
    const work_code = event.currentTarget.dataset.work_code;
    const task_code = event.currentTarget.dataset.task_code;
    const action = 'checkout'   // 出库标志位
    const title = event.currentTarget.dataset.title;   // 显示在modal上的title
    const showCode = event.currentTarget.dataset.showCode;  // 显示在modal上的code

    this.setData({
      taskListIndex: index,
    });

    this.scanCode(action, machine_code, work_code, task_code, title, showCode);
  },

  // 出入库扫码的统一函数
  scanCode(action, machine_code, work_code, task_code, title, showCode) {
    const that = this;
    wx.scanCode({
      success: (res) => {
        
        const resultCode = res.result;   // 扫码结果
        const qr_code = resultCode;    // 要传递的参数
        let url = '';
        let data = {
          machine_code : machine_code,
          qr_code: qr_code
        };

        // 判断是仓库信息框中扫码还是卡板信息扫码
        if (action == 'checkin') {
          url = '/pda/suz/machine/checkin/scan';
        } else if (action == 'checkout') {
          url = '/pda/suz/machine/checkout/scan';
        } else {
          app.showErrorToast('客户端错误：502');
          return;
        }

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
            // http码
            if(result.statusCode == normalHttpCode) {
              // 业务状态码
              if (result.data.code == normalBusinessCode) {
                const data = result.data.data;
                console.log(data);
                  // 更新数据值
                  that.setData(  {
                    modalInOutWarehouseData: data,
                    title: title,
                    showCode: showCode,

                    // showInWarehouseModal: true,
                    postInWarehouseData: {
                      machine_code: machine_code,
                      pallet_code: data.pallet_code,
                      work_code: work_code,
                      task_code: task_code

                    },
                    warehouseInOutNum: data.material_num,
                  });
                  // 判断是仓库信息框中扫码还是卡板信息扫码
                  if (action == 'checkin') {
                    that.setData({
                      showInWarehouseModal: true
                    });
                  } else if (action == 'checkout') {
                    that.setData({
                      showOutWarehouseModal: true
                    });
                  } else {
                    app.showErrorToast('客户端错误：502');
                    return;
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
        console.log(`扫描失败`);
      }
    })
    
  },


  // modal框提交入库的操作
  postInWarehouse() {
    const url = '/pda/suz/machine/checkin';
    const data = this.data.postInWarehouseData;
    const type = 'inWarehouse';
    const index = this.data.taskListIndex;
    this.postInOutInterface(url, data, type, index);
  },

  // modal框提交出库的操作
  postOutWarehouse() {
    const url = '/pda/suz/machine/checkout';
    const data = this.data.postInWarehouseData;
    const type = 'outWarehouse';
    const index = this.data.taskListIndex;
    this.postInOutInterface(url, data, type, index);
  },

  // 入库出库的统一post请求接口
  postInOutInterface(url, data, type, index) {
    // 返回值
    const that = this;
    wx.request({
      url: app.globalData.serverUrl + url,
      data: data,
      dataType: 'json',
      header: {
        "content-type" : "application/json",
        "Authorization" : wx.getStorageSync('token_type')+" "+wx.getStorageSync('access_token')
      },
      method: 'POST',
      success: (result) => {
        app.processPostRequestStatusCode(result.statusCode);
        if(result.statusCode == normalHttpCode) {
          // 业务状态码
          if (result.data.code == normalBusinessCode) {
            console.log(result.data.data)
            
            // 如果是A库入库
            if(type == 'inWarehouse') {
              let list = this.data.taskList;
              list[index].repo_A = parseInt(that.data.taskList[index].repo_A) + parseInt(that.data.warehouseInOutNum);
              // 添加到已报良品数量上
              that.setData({
                taskList: list,
              });
              // console.log("修改后良品数量:",this.data.repo_A);
              app.showSuccessToast('入库成功');
            }
            // 如果是B库出库
            else if (type == 'outWarehouse') {
              let list = this.data.taskList;
              if (that.data.warehouseInOutNum) {
                list[index].repo_B = parseInt(that.data.taskList[index].repo_B) - parseInt(that.data.warehouseInOutNum);
              }
              // 添加
              that.setData({
                taskList: list,
              });
              app.showSuccessToast('出库成功');

            }
            // 如果是修改人员状态
            else if (type == CHANGE_OPREATOR_STATUS) {


            }
            // 异常
            else {
              app.showErrorToast('503客户端错误');
            }
          }
        } else {
          app.showErrorToast(result.errMsg);
        }
        
      },
      fail: (result) => {
        app.showErrorToast("本地网络故障");
        console.log(result)
        
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

  // 获取输入框内容
  getReportNumInput(event) {
    this.setData({
      reportNumber: Number(event.detail.value),
    });
  },


  // 获取次品原因手写项的输入内容
  getDefectReasonInput(event) {
    this.setData({
      defectReasonText: event.detail.value,
    })
  },


  // 获取修改设备状态原因手写项的输入内容
  getChangeDeviceStatusReasonInput(event) {
    this.setData({
      changeDeviceStatusReasonText: event.detail.value,
    })
  },

  getFaultReportStatusReasonInput(evnet) {
    this.setData({
      faultReportStatusReasonText: evnet.detail.value,
    })
  },

  changeFaultReportStartTime(event) {
    this.setData({
      faultReportStartTime: event.detail.value,
    })
  },

  changeFaultReportEndTime(event) {
    this.setData({
      faultReportEndTime: event.detail.value,
    })
  }





})
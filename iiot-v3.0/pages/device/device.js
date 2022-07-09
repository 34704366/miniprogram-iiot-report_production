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
    machine_status_obj: {
      "1": "设备预热",
      "2": "设备试生产",
      "3": "设备生产循环",
      "4": "设备清洗",
    },
    statusIndex: 0,
    selected_machine_code: '',
    modalInOutWarehouseData: {}, 
    reportNumber: "", 
    showReportModal: false,  
    isDefectReportFlag: false, 
    defectReasonArray: [], 
    defectReasonValueArray: [],  
    dri: 0,   
    drvi: 0,  
    defectRT: '', 
    cdsrt: '',   
    frsrt: '',  
    showChangeDeviceStatusModal: false,
    machineStatusModalData: {},
    postDeviceStatusValue: 0,
    showFaultReportModal: false,
    loading: true,  
    taskListHeaderText: '',
    fixListHeaderText: '',
    collapse_unfoldFlag: [0,1],
  },
  
   // 处理分栏面板的点击事件
   handleCollapseChange(event) {
    this.setData({
      collapse_unfoldFlag: event.detail.value,
    });
  },

  handleRefresh() {
    // 延迟动画加载
    setTimeout(() => {
      this.refreshData();
      console.log('handle refresh');
      //停止下拉刷新
      wx.stopPullDownRefresh();
    }, 300)
  },

  onPullDownRefresh:function(){
    
    this.handleRefresh()
  },

  onLoad: function (options) {
    this.refreshData();
    console.log('device onLoad');
  },
  
  onShow: function (options) {
    // 获取设备列表
    // this.refreshData();

    const that = this;
    // this.judgeOpreatorStatus();


    wx.getStorage({
      key: 'jump_task_data',
      success(res) {
        that.setData({
          // 展开分栏
          collapse_unfoldFlag: [0,1],  
        })
        const info_data = res.data;
        // console.log(info_data)
        setTimeout(function () {
          let taskList = that.data.taskList;
          let fixList = that.data.fixList;

          // task_list
          for (let item of taskList) {
            if (item.task_code == info_data.task_code) {
              console.log('yes')
              // 展开
              item.onHide = 0;

              // 更新信息
              for (let key in info_data) {
                if (item[key]) {
                  item[key] = info_data[key];
                }
              }
            } else {
              // 折叠
              item.onHide = 1;
            }
          }

          for (let item of fixList) {
            if (item.task_code == info_data.task_code) {
              console.log('fix yes');
              // 展开
              item.onHide = 0;

              // 更新信息
              for (let key in info_data) {
                if (item[key]) {
                  item[key] = info_data[key];
                  // console.log(info_data[key]);
                }
              }
            } else {
              // 折叠
              item.onHide = 1;
            }
          }

          that.setData({
            taskList: taskList,
            fixList: fixList,

          })



        }, 300);

        setTimeout(function(){
          console.log(info_data.task_code)
          // 滑动到指定位置
          wx.pageScrollTo({
            duration: 300,
            // 偏移距离
            offsetTop: -100,
            selector: '#'+info_data.task_code,
            success: (res) => {
              // console.log(res)
            },
            fail: (res) => {},
            complete: (res) => {},
          })
        },200);




        // 拿到machine_code以后从缓存删除掉
        wx.removeStorage({
          key: 'jump_task_data',
        })
        
      },
      fail(res) {
        wx.removeStorage({
          key: 'jump_task_data',
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

            console.log(result.data.data);
            let list = [];

            for (const item of result.data.data) {

              item.onHide = 1;  
              for (const oldItem of oldTaskList) {
                if (oldItem.task_code == item.task_code) {
                  if (oldItem.onHide == 0) {
                    item.onHide = oldItem.onHide;
                  }
                }
              }

              let {inDuty,offDuty} = this.judgeOpreatorStatus(item.operator_status);
              item.inDuty = inDuty;
              item.offDuty = offDuty;

              let machine_status_array = [];
              let machine_status_index = [];
              item.deviceNowStatus = '扫码'  
              for (const index in item.machine_status_obj) {
                for (const i in item.machine_status_obj[index].status) {
                  const status = item.machine_status_obj[index].status;
                  const value = status[i];
                  let isChecked = false;
                  if (String(value) == String(item.machine_status)) {
                    isChecked = true;
                    item.deviceNowStatus = i;
                  }
                  status[i] = {
                    'value': value,
                    'isChecked': isChecked
                  }
                  // console.log(item.machine_status_obj[index].status[i])
                }
                // console.log(machine_status_obj[index]);
              }


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
              taskList: list,
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
    const type = TEST_REPORT; 
    const machine_code = event.currentTarget.dataset.machine_code;
    const work_order = event.currentTarget.dataset.work_order;
    const task_code = event.currentTarget.dataset.task_code;

    const title = event.currentTarget.dataset.title;   
    const showCode = event.currentTarget.dataset.showCode;  

    this.setData({
      showReportModal: true,
      reportModalText: '调机报数',
      reportType: type,
      taskListIndex: index,
      machine_code: machine_code,   
      work_order: work_order ,     
      task_code: task_code,     
      reportNumber: '',

      isDefectReportFlag: false,    
      title: title,
      showCode: showCode,
    })
  },


  passReportClick(event) {
    const index = event.currentTarget.dataset.index;
    const type = PASS_REPORT;  
    const machine_code = event.currentTarget.dataset.machine_code;
    const work_order = event.currentTarget.dataset.work_order;
    const task_code = event.currentTarget.dataset.task_code;

    const title = event.currentTarget.dataset.title; 
    const showCode = event.currentTarget.dataset.showCode; 

    this.setData({
      showReportModal: true,
      reportModalText: '良品报数',
      reportType: type,
      taskListIndex: index,

      machine_code: machine_code,   
      work_order: work_order ,   
      task_code: task_code,     
      reportNumber: '',

      isDefectReportFlag: false,    
      title: title,
      showCode: showCode,

      defectRT: ''
    })
  },

 
  defectReportClick(event) {
    const index = event.currentTarget.dataset.index;  
    const type = DEFECT_REPORT;  
    const machine_code = event.currentTarget.dataset.machine_code;
    const work_order = event.currentTarget.dataset.work_order;
    const task_code = event.currentTarget.dataset.task_code;

    const title = event.currentTarget.dataset.title;  
    const showCode = event.currentTarget.dataset.showCode;  
    console.log(`click: data: ${machine_code, work_order, task_code}`)
    this.setData({
      showReportModal: true,
      reportModalText: '次品报数',
      reportType: type,
      taskListIndex: index,

      machine_code: machine_code,   
      work_order: work_order ,    
      task_code: task_code,     
      reportNumber: '',

      isDefectReportFlag: true,     
      title: title,
      showCode: showCode,

      defectRT: '',
    })

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
      dri: index,
      drvi: index,
    })
  },


  postReport(event) {
    const type = this.data.reportType;
    const machine_code = this.data.machine_code;
    const work_order = this.data.work_order;
    const task_code = this.data.task_code;
    const quantity = this.data.reportNumber;
    const index = this.data.taskListIndex;

    if (quantity < 0 || quantity === '') {
      app.showErrorToast('请输入大于0的数量');
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
      const reason = this.data.defectReasonValueArray[this.data.drvi];  
      const param = this.data.defectRT;
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
            
            // 如果是调机报产
            if(type == TEST_REPORT) {
              app.showSuccessToast('调机报产成功');
            }
            else if (type == PASS_REPORT) {
              app.showSuccessToast('良品报产成功');
              
            }
            else if (type == DEFECT_REPORT) {
              app.showSuccessToast('次品报产成功');
              
            }
            else if (type == FAULT_REPORT) {
              app.showSuccessToast('故障上报成功');
            }

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


  faultReportClick(event) {
    const index = event.currentTarget.dataset.index;  

    const machine_code = event.currentTarget.dataset.machine_code;
    const work_order = event.currentTarget.dataset.work_order;
    const task_code = event.currentTarget.dataset.task_code;

    const title = event.currentTarget.dataset.title;   
    const showCode = event.currentTarget.dataset.showCode;  
    
    const machine_status = this.data.taskList[index].machine_status_obj;
    let fault_status = [];
 
    for(let key in machine_status) {
     
      if (machine_status[key].is_fault == 1 || machine_status[key].is_fault == '1') {
        fault_status.push(machine_status[key]);
        
      }
    }

    this.setData({
      showFaultReportModal: true,
      taskListIndex: index,

      machine_code: machine_code,   
      work_order: work_order ,    
      task_code: task_code,     

      title: title,
      showCode: showCode,


      faultStatusModalData: fault_status,
      frsrt: ''
    })

  },


  changeFaultStatusRadioClick(event) {

    const status_value = event.detail.value;
    console.log(status_value);

    this.setData({
      postFaultStatusValue: status_value
    })
  },



  postFaultReport(event) {
    const status = this.data.postFaultStatusValue;


    const machine_code = this.data.machine_code;
    const work_order = this.data.work_order;
    const task_code = this.data.task_code;

    const param = this.data.frsrt;
    let start_time = this.data.faultReportStartTime;
    let end_time = this.data.faultReportEndTime;
    

    if (!start_time || !end_time) {
      app.showErrorToast('日期不能为空');
      console.log('日期为空')
      return;
    } 

    let date = new Date(new Date()).toLocaleDateString();
    date = date.replace(/\//g , '-');  
    start_time = date + ' ' + start_time + ':00';
    end_time = date + ' ' + end_time + ':00';


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


  changeDeviceStatusClick(event) {
    const index = event.currentTarget.dataset.index;  

    const machine_code = event.currentTarget.dataset.machine_code;
    const work_order = event.currentTarget.dataset.work_order;
    const task_code = event.currentTarget.dataset.task_code;

    const title = event.currentTarget.dataset.title;   
    const showCode = event.currentTarget.dataset.showCode;  



    const machineStatusModalData = this.data.taskList[index].machine_status_obj;

    this.setData({
      showChangeDeviceStatusModal: true,
      taskListIndex: index,

      machine_code: machine_code,   
      work_order: work_order ,    
      task_code: task_code,     

      title: title,
      showCode: showCode,

      machineStatusModalData: machineStatusModalData,
      cdsrt: '',
    })
  },

  
  changeDeviceStatusRadioClick(event) {

    const status_value = event.detail.value;

    this.setData({
      postDeviceStatusValue: status_value
    })
    console.log(status_value)
  },

  
  postDeviceStatusChange(event) {
    const status = this.data.postDeviceStatusValue;


    const machine_code = this.data.machine_code;
    const work_order = this.data.work_order;
    const task_code = this.data.task_code;

    const param = this.data.frsrt;

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


  sourceChange: function(e) {


    let materialArray = [];
    let list = this.data.InWarehouseInfoArray[e.detail.value].material;
    for (const key in list) {
      materialArray.push(list[key].material_name);
    }
    
    let material_num = this.data.InWarehouseInfoArray[e.detail.value].material[0].material_num;
    
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
    
    let material_code = this.data.InWarehouseInfoArray[this.data.sourceIndex].material[e.detail.value].material_code;

    this.setData({
      materialIndex: e.detail.value,
      material_num: material_num,
      material_code: material_code
    })
  },


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



    const taskStatus = objectList[index].task_status;
    if (taskStatus == "未启动") {
      const url = app.globalData.serverUrl + "/pda/suz/task/start";

      const data = {
        task_code: objectList[index].task_code,
        task_type: type,
      }


      console.log(data)

      this.taskRequest(url, data);
      
    } else if (taskStatus == "进行中") {
      const url = app.globalData.serverUrl + "/pda/suz/task/end";
      const data = {
        task_type: type,
        task_code: objectList[index].task_code,
      }

      this.taskRequest(url, data);
    } else {
      console.log('后端传来的任务状态既不是未启动也不是进行中，可能又换词了');
      app.showErrorToast('客户端错误505');
    }

  },


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
    const action = 'checkin'   
    const title = event.currentTarget.dataset.title;   
    const showCode = event.currentTarget.dataset.showCode;  

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
    const action = 'checkout'   
    const title = event.currentTarget.dataset.title;  
    const showCode = event.currentTarget.dataset.showCode;  

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
        
        const resultCode = res.result;   
        const qr_code = resultCode;    
        let url = '';
        let data = {
          machine_code : machine_code,
          qr_code: qr_code
        };

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


  postInWarehouse() {
    const url = '/pda/suz/machine/checkin';
    const data = this.data.postInWarehouseData;
    const type = 'inWarehouse';
    const index = this.data.taskListIndex;
    this.postInOutInterface(url, data, type, index);
  },

  postOutWarehouse() {
    const url = '/pda/suz/machine/checkout';
    const data = this.data.postInWarehouseData;
    const type = 'outWarehouse';
    const index = this.data.taskListIndex;
    this.postInOutInterface(url, data, type, index);
  },

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
              that.refreshData();
              app.showSuccessToast('入库成功');
            }
            // 如果是B库出库
            else if (type == 'outWarehouse') {
              that.refreshData();
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

  
  getReportNumInput(event) {
    this.setData({
      reportNumber: Number(event.detail.value),
    });
  },


  getDefectReasonInput(event) {
    this.setData({
      defectRT: event.detail.value,
    })
  },


  getChangeDeviceStatusReasonInput(event) {
    this.setData({
      cdsrt: event.detail.value,
    })
  },


  getFaultReportStatusReasonInput(evnet) {
    this.setData({
      frsrt: evnet.detail.value,
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
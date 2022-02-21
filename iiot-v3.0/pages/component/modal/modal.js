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
    repo_code: {
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
     }
  }
})

const app = getApp()

Page({
  data: {
    aspectCanvas: {
      canvasWidth: 392,
      canvasHeight: 366,
      fontSize: 40,
        categories:['智商', '高贵', '暖心', '吃货', '颜值']
    },
    currentPetNumber:'m000225',
    dimension:[7.5,10.0,12.5,2.5,0],
    radarData:{},
    currentRadarImage: ""
  },
  onLoad: function () {

  },
    onShow(){
        console.log("hello");
        const radarData = this.returnRadarData(this.data.dimension);
        this.setData({ radarData });
        const {gender,id,radarList}=this.data.radarData;
        console.log(gender,id,radarList);
    },
  returnRadarData(dimension) {
    const petNumber = this.data.currentPetNumber;
    return {
      gender: 1,
      id: petNumber,
      radarList: dimension
    };
  }
})
import React from "react";
import { toJS } from "mobx";
import { inject, observer } from "mobx-react";
import { withRouter } from "react-router-dom";

import ImageList from "./ImageList";
//import ImageListRandom from "./ImageListRandom";
import BoundingBox from "./BoundingBox";
import Controls from "./BoundingBox/Controls";
import Threshold from "./Threshold";
import InputForm from "./InputForm";

import ParamSlider from "../commons/ParamSlider";
import Description from "../commons/Description";
import CardCommands from "../commons/CardCommands";
import ToggleControl from "../commons/ToggleControl";

@inject("imaginateStore")
@withRouter
@observer
export default class ImageConnector extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedBoxIndex: -1,
      sliderBest: 1,
      sliderSearchNn: 10,
      boxFormat: "simple",
      showLabels: false,
      segmentationMask: true
    };

    this.onOver = this.onOver.bind(this);
    this.onLeave = this.onLeave.bind(this);

    this.confidenceTooltipFormatter = this.confidenceTooltipFormatter.bind(
      this
    );
    this.handleConfidenceThreshold = this.handleConfidenceThreshold.bind(this);
    this.handleBestThreshold = this.handleBestThreshold.bind(this);
    this.handleSearchNnThreshold = this.handleSearchNnThreshold.bind(this);
    this.handleMultisearchRois = this.handleMultisearchRois.bind(this);
    this.handleSegmentationMaskToggle = this.handleSegmentationMaskToggle.bind(
      this
    );

    this.setBoxFormat = this.setBoxFormat.bind(this);
    this.toggleLabels = this.toggleLabels.bind(this);
  }

  setBoxFormat(format) {
    this.setState({ boxFormat: format });
  }

  toggleLabels() {
    this.setState({ showLabels: !this.state.showLabels });
  }

  onOver(index) {
    this.setState({ selectedBoxIndex: index });
  }

  onLeave() {
    this.setState({ selectedBoxIndex: -1 });
  }

  confidenceTooltipFormatter(value) {
    return (value / 100).toFixed(2);
  }

  handleConfidenceThreshold(value) {
    const { serviceSettings } = this.props.imaginateStore;
    serviceSettings.threshold.confidence = parseFloat((value / 100).toFixed(2));
    if (serviceSettings.threshold.confidence === 0) {
      serviceSettings.threshold.confidence = 0.01;
    }
    this.props.imaginateStore.predict();
  }

  handleBestThreshold(value) {
    const { serviceSettings } = this.props.imaginateStore;
    serviceSettings.request.best = parseInt(value, 10);
    this.setState({ sliderBest: value });
    this.props.imaginateStore.predict();
  }

  handleSearchNnThreshold(value) {
    const { serviceSettings } = this.props.imaginateStore;
    serviceSettings.request.search_nn = parseInt(value, 10);
    this.setState({ sliderSearchNn: value });
    this.props.imaginateStore.predict();
  }

  handleMultisearchRois(value) {
    const { serviceSettings } = this.props.imaginateStore;

    this.setState({
      multibox_rois: !this.state.multibox_rois,
      boxFormat: "simple",
      showLabels: false
    });

    serviceSettings.request.multibox_rois = !this.state.multibox_rois;
    this.props.imaginateStore.predict();
  }

  handleSegmentationMaskToggle(e) {
    const { service } = this.props.imaginateStore;
    service.settings.segmentationMask = e.target.checked;
    this.setState({
      segmentationMask: e.target.checked
    });
    this.props.imaginateStore.predict();
  }

  render() {
    const { service, serviceSettings } = this.props.imaginateStore;

    if (!service) return null;

    const input = service.selectedInput;

    let uiControls = [];

    if (service.settings.mltype === "instance_segmentation") {
      console.log(
        service.settings.segmentationMask
          ? "segmenationMask"
          : "no segmenationMask"
      );
      uiControls.push(
        <ToggleControl
          key="settingCheckbox-display-mask"
          title="Segmentation Mask"
          value={this.state.segmentationMask}
          onChange={this.handleSegmentationMaskToggle}
        />
      );
    }

    if (
      input &&
      !input.hasPredictionValues &&
      !input.isCtcOuput &&
      !input.isSegmentationInput
    ) {
      uiControls.push(<Threshold key="threshold" />);

      // Note: the threshold confidence variable in the key attribute
      // is a hack to update the slider when user pushes
      // on other external threshold (salient/medium/detailed for example)
      uiControls.push(
        <ParamSlider
          key={`paramSliderConfidence-${serviceSettings.threshold.confidence}`}
          title="Confidence threshold"
          defaultValue={parseInt(
            serviceSettings.threshold.confidence * 100,
            10
          )}
          onAfterChange={this.handleConfidenceThreshold}
          tipFormatter={this.confidenceTooltipFormatter}
        />
      );

      if (service.settings.mltype === "classification") {
        // && service.respInfo.body.parameters.mllib[0].nclasses.length > 0

        uiControls.push(
          <ParamSlider
            key="paramSliderBest"
            title="Best threshold"
            defaultValue={this.state.sliderBest}
            onAfterChange={this.handleBestThreshold}
            min={1}
            max={20}
          />
        );
      }
    }

    if (
      service.respInfo &&
      service.respInfo.body &&
      service.respInfo.body.mltype === "rois"
    ) {
      uiControls.push(
        <ToggleControl
          key="paramMultisearchRois"
          title="Multisearch ROIs"
          value={this.state.multibox_rois}
          onChange={this.handleMultisearchRois}
        />
      );

      uiControls.push(
        <ParamSlider
          key="paramSliderSearchNn"
          title="Search Size"
          defaultValue={this.state.sliderSearchNn}
          onAfterChange={this.handleSearchNnThreshold}
          min={0}
          max={100}
        />
      );
    }

    // Hide controls when displaying categories as description
    // For example, in OCR models
    let boundingBoxControls = true;
    if (
      service.settings.mltype === "ctc" ||
      (service.respInfo &&
        service.respInfo.body &&
        service.respInfo.body.mltype === "classification") ||
      (input &&
        input.json &&
        input.json.body &&
        input.json.body.predictions &&
        input.json.body.predictions[0] &&
        (typeof input.json.body.predictions[0].rois !== "undefined" ||
          typeof input.json.body.predictions[0].nns !== "undefined")) ||
      (input &&
        input.postData &&
        input.postData.parameters &&
        input.postData.parameters.input &&
        input.postData.parameters.input.segmentation)
    ) {
      boundingBoxControls = false;
    }

    return (
      <div className="imaginate">
        <div className="row">
          <div className="col-md-7">
            <div className="row">
              <div className="img-list col-sm-12">
                <ImageList />
              </div>
            </div>

            {service.isRequesting ? (
              <div className="alert alert-primary" role="alert">
                <i className="fas fa-spinner fa-spin" />&nbsp; Loading...
              </div>
            ) : (
              ""
            )}

            <div className="row">
              {boundingBoxControls ? (
                <Controls
                  handleClickBox={this.setBoxFormat.bind(this, "simple")}
                  handleClickPalette={this.setBoxFormat.bind(this, "color")}
                  handleClickLabels={this.toggleLabels}
                  boxFormat={this.state.boxFormat}
                  showLabels={this.state.showLabels}
                />
              ) : (
                ""
              )}
            </div>
            <div className="row">
              <BoundingBox
                selectedBoxIndex={this.state.selectedBoxIndex}
                onOver={this.onOver}
                input={toJS(service.selectedInput)}
                displaySettings={toJS(serviceSettings.display)}
                boxFormat={this.state.boxFormat}
                showLabels={this.state.showLabels}
              />
            </div>
          </div>
          <div className="col-md-5">
            <InputForm />
            {uiControls}
            <div className="description">
              <Description
                selectedBoxIndex={this.state.selectedBoxIndex}
                onOver={this.onOver}
                onLeave={this.onLeave}
              />
            </div>
            <div className="commands">
              <CardCommands />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

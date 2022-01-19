import React from "react";
import PropTypes from "prop-types";
import { observer } from "mobx-react";

import TitleItem from "./TitleItem";

@observer
class MultiTitle extends React.Component {
  render() {
    const {
      services,
      hiddenRepositoriesIndexes,
      handleRepositoryVisibility,
      handlePublishModalServiceIndex
    } = this.props;

    let tableColumns = [
      {
        text: "Name",
        selector: "name",
        classNameFormatter: (props) => {
          return `chart-cell-${props.serviceIndex % 8}`
        }
      },
      {
        text: "Train Loss",
        selector: "train_loss",
        isValue: true,
        formatter: (value, props) => {
          let content = value;
          if (value && typeof value.toFixed === "function") {
            if (value > 1) {
              content = value.toFixed(3);
            } else {
              // Find position of first number after the comma
              const zeroPosition = value
                    .toString()
                    .split("0")
                    .slice(2)
                    .findIndex(elem => elem.length > 0);

              content = value.toFixed(zeroPosition + 4);
            }
          }
          return content;
        }
      },
      {
        text: "Iterations",
        selector: "iteration",
        isMeasure: true,
      },
      {
        text: "Iteration (best)",
        selector: "iteration",
        isBest: true,
      }
    ];

    const firstService = services.length > 0 ?
          services[0] : null;

    if( firstService.isTimeSeries ) {
      tableColumns.push({
        text: "Eucll (best)",
        selector: "eucll",
        isBest: true,
        formatter: (value, props) => {
          return value !== "--" ? parseFloat(value).toFixed(5) : value;
        }
      });
    } else {

      switch (firstService.mltype) {
        case "segmentation":
          tableColumns.push({
            text: "Mean IOU (best)",
            selector: "meaniou",
            isBest: true,
            formatter: (value, props) => {
              return value !== "--" ? parseFloat(value).toFixed(5) : value;
            }
          });
          break;
        case "detection":
          tableColumns.push({
            text: "MAP",
            selector: "map",
            formatter: (value, props) => {
              return value !== "--" ? parseFloat(value).toFixed(5) : value;
            }
          });
          break;
        case "ctc":
          tableColumns.push({
            text: "Acc",
            selector: "acc",
            formatter: (value, props) => {
              return value !== "--" ? parseFloat(value).toFixed(5) : value;
            }
          });
          break;
        case "classification":
          tableColumns.push({
            text: "Acc",
            selector: "acc",
            formatter: (value, props) => {
              return value !== "--" ? parseFloat(value).toFixed(5) : value;
            }
          });
          tableColumns.push({
            text: "f1",
            selector: "f1",
            formatter: (value, props) => {
              return value !== "--" ? parseFloat(value).toFixed(5) : value;
            }
          });
          tableColumns.push({
            text: "mcll",
            selector: "mcll",
            formatter: (value, props) => {
              return value !== "--" ? parseFloat(value).toFixed(5) : value;
            }
          });
          break;
        case "regression":
        case "autoencoder":
          tableColumns.push({
            text: "eucll",
            selector: "eucll",
            formatter: (value, props) => {
              return value !== "--" ? parseFloat(value).toFixed(5) : value;
            }
          });
          break;
        default:
          break;
      }
    }

    tableColumns = tableColumns.concat([
      {
        text: "JSON",
        formatter: (value, props) => {
          return <>
            <a
              href={`${props.service.path}config.json`}
              className="badge badge-dark"
              target="_blank"
              rel="noopener noreferrer"
            >
              config
            </a>
            <br />
            <a
              href={`${props.service.path}metrics.json`}
              className="badge badge-dark"
              target="_blank"
              rel="noopener noreferrer"
            >
              metrics
            </a>
          </>
        }
      },
      {
        text: "",
        formatter: (value, props) => {
          return <>
                   <i
                     className={`chart-badge-${parseInt(props.serviceIndex) % 8} fa fa-2x fa-toggle-${
              props.isVisible ? "off" : "on"
            }`}
                     onClick={props.handleRepositoryVisibility.bind(this, props.serviceIndex)}
                   />
                   {
                     props.handlePublishModalServiceIndex ?
                       <>
                         <br/>
                         <button
                           className="btn btn-outline-secondary btn-publish-service"
                           onClick={props.handlePublishModalServiceIndex.bind(this, props.serviceIndex)}
                          >
                           <i
                             className={`publish-badge-${parseInt(props.serviceIndex) % 8} fas fa-plus`}
                           />
                         </button>
                       </>
                       : null
                   }
          </>
        }
      }
    ]);

    return (
      <table className="title trainingmonitor-multititle">
        <thead>
          <tr>
            { tableColumns.map((col, k) => <th key={k}>{col.text}</th>) }
          </tr>
        </thead>
        <tbody>
          {services.map((service, index) => {
            return (
              <TitleItem
                key={`title-${service.name}`}
                service={service}
                serviceIndex={index}
                isVisible={hiddenRepositoriesIndexes.includes(index)}
                handleRepositoryVisibility={handleRepositoryVisibility}
                handlePublishModalServiceIndex={handlePublishModalServiceIndex}
                tableColumns={tableColumns}
              />
            );
          })}
        </tbody>
      </table>
    );
  }
}

MultiTitle.propTypes = {
  services: PropTypes.array.isRequired,
  hiddenRepositoriesIndexes: PropTypes.array,
  handleRepositoryVisibility: PropTypes.func,
  handlePublishModalServiceIndex: PropTypes.func
};
export default MultiTitle;

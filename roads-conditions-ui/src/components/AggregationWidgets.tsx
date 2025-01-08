import React from 'react';
import { FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa';

const AggregationWidget: React.FC<{ aggregations: any }> = ({ aggregations }) => {
  const renderTrend = (trend: number, opposite: boolean = true) => {
    var shouldRenderGreen = trend > 0 && !opposite || trend < 0 && opposite;
    var shouldRenderRed = trend < 0 && !opposite || trend > 0 && opposite;

    if (shouldRenderGreen) return <span>%{Math.round(trend)}<FaArrowUp color="green" data-tooltip={`+${trend}%`} className="trend" /></span>;
    if (shouldRenderRed) return <span>%{Math.round(trend)}<FaArrowDown color="red" data-tooltip={`${trend}%`} className="trend" /></span>;
    return <FaMinus color="gray" data-tooltip="No Change" className="trend" />;
  };

  return (
    <div className="aggregation-widget">
      <div className="aggregation-item">
        <span>مفتوح للداخل = {Math.round(aggregations.openEnterPercentage)}%</span>
        {renderTrend(aggregations.openEnterTrend, false)}
      </div>
      <div className="aggregation-item">
        <span>مفتوح للخارج = {Math.round(aggregations.openExitPercentage)}%</span>
        {renderTrend(aggregations.openExitTrend, false)}
      </div>
      <div className="aggregation-item">
        <span>ازمة للداخل = {Math.round(aggregations.trafficEnterPercentage)}%</span>
        {renderTrend(aggregations.trafficEnterTrend)}
      </div>
      <div className="aggregation-item">
        <span>ازمة للخارج = {Math.round(aggregations.trafficExitPercentage)}%</span>
        {renderTrend(aggregations.trafficExitTrend)}
      </div>
      <div className="aggregation-item">
        <span>مغلق للداخل = {Math.round(aggregations.closedEnterPercentage)}%</span>
        {renderTrend(aggregations.closedEnterTrend)}
      </div>
      <div className="aggregation-item">
        <span>مغلق للخارج = {Math.round(aggregations.closedExitPercentage)}%</span>
        {renderTrend(aggregations.closedExitTrend)}
      </div>
    </div>
  );
};

export default AggregationWidget;

import React, { useRef } from 'react';
import { Doughnut, getElementAtEvent } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import { useTheme } from './ThemeContext';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

function FeedbackChart({ feedbackData, onSegmentClick }) {
    const { theme } = useTheme();
    const chartRef = useRef();

    const onHover = (event, chartElement) => {
        const canvas = event.native?.target;
        if (canvas) canvas.style.cursor = chartElement[0] ? 'pointer' : 'default';
    };

    const handleChartClick = (event) => {
        if (!chartRef.current) return;

        const elements = getElementAtEvent(chartRef.current, event);

        if (elements.length > 0) {
            const clickedElementIndex = elements[0].index;
            const chartData = processDataForChart();
            const clickedLabel = chartData.labels[clickedElementIndex];
            
            if (onSegmentClick) {
                onSegmentClick(clickedLabel);
            }
        }
    };
    const processDataForChart = () => {
        const categoryCounts = feedbackData.reduce((acc, fb) => {
            acc[fb.issue] = (acc[fb.issue] || 0) + 1;
            return acc;
        }, {});

        const labels = Object.keys(categoryCounts);
        const data = Object.values(categoryCounts);

        return {
            labels,
            datasets: [
                {
                    label: '# of Feedback',
                    data,
                    backgroundColor: [
                        'rgba(26, 188, 156, 0.7)',
                        'rgba(52, 152, 219, 0.7)',
                        'rgba(231, 76, 60, 0.7)',
                        'rgba(241, 196, 15, 0.7)',
                        'rgba(155, 89, 182, 0.7)',
                        'rgba(52, 73, 94, 0.7)',
                        'rgba(230, 126, 34, 0.7)',
                    ],
                    borderColor: theme === 'dark' ? '#34495e' : '#ffffff',
                    borderWidth: 2,
                },
            ],
        };
    };

    const chartData = processDataForChart();

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    color: theme === 'dark' ? '#ecf0f1' : '#34495e',
                    padding: 20,
                },
            },
            title: {
                display: false,
            },
        },
        onHover: onHover,
        cutout: '60%',
        animation: {
            animateScale: true,
            animateRotate: true
        }
    };

    return (
        <div className="chart-container">
            {feedbackData.length > 0 ? (
                <Doughnut ref={chartRef} data={chartData} options={options} onClick={handleChartClick}/>
            ) : (
                <p>No feedback data available to display chart.</p>
            )}
        </div>
    );
}

export default FeedbackChart;
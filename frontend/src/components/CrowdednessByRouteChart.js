import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useTheme } from './ThemeContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function CrowdednessByRouteChart({ crowdednessData }) {
    const { theme } = useTheme();

    const chartData = useMemo(() => {
        const crowdedReports = crowdednessData.filter(report => report.level === 'crowded');
        const countsByRoute = crowdedReports.reduce((acc, report) => {
            acc[report.route] = (acc[report.route] || 0) + 1;
            return acc;
        }, {});

        const sortedRoutes = Object.entries(countsByRoute).sort(([, a], [, b]) => b - a);

        const labels = sortedRoutes.map(entry => entry[0]);
        const data = sortedRoutes.map(entry => entry[1]);

        return {
            labels,
            datasets: [{
                label: 'Number of "Crowded" Reports',
                data,
                backgroundColor: theme === 'dark' ? 'rgba(220, 53, 69, 0.6)' : 'rgba(220, 53, 69, 0.7)',
                borderColor: '#dc3545',
                borderWidth: 1,
            }]
        };
    }, [crowdednessData, theme]);

    const options = {
        indexAxis: 'y', // Horizontal bar chart
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                beginAtZero: true,
                ticks: {
                    color: theme === 'dark' ? '#c9d1d9' : '#6c757d',
                    stepSize: 1
                },
                grid: {
                    color: theme === 'dark' ? '#30363d' : '#dee2e6',
                }
            },
            y: {
                ticks: {
                    color: theme === 'dark' ? '#c9d1d9' : '#6c757d',
                },
                grid: {
                    display: false,
                }
            }
        },
        plugins: {
            legend: {
                display: false,
            }
        }
    };

    return <Bar data={chartData} options={options} />;
}

export default CrowdednessByRouteChart;
(function(helpers)
{
    var self;

    function BurndownEngineHelper()
    {
		this._usEstimationsCache = null;
    }

    Object.defineProperties(BurndownEngineHelper.prototype,
    {
		 /**
         * Builds the merged userStories map with totalTasks and isClosed from Jira data and the resource grid.
         * Result is cached in this._usEstimationsCache for reuse.
         *
         * @param {Object} usResources - Map of usKey → array of day objects.
         * @param {Array} usJData - User stories from Jira API.
         * @returns {Object} { userStories: Object, totalTasks: number }
         */
        buildUSEstimations : {
            value: function(usResources, usJData, commitmentIssues)
            {
                var usEstimations = {};

                if (usJData && usJData.length)
                {
                    $.each(usJData, function(_, us)
                    {
                        if (us.fields.subtasks && us.fields.subtasks.length > 0)
                        {
							let ClosureDate = null;
							if (us.fields.status.name === "Closed")
							{
								ClosureDate = us.fields.statuscategorychangedate;
							}
							else if (us.fields.subtasks.every(st => ["RESOLVED", "CLOSED", "Rejected (migrated)"].includes(st.fields.status.name)))
							{
								us.fields.subtasks.forEach(st => {		
									const commitmentIssue = commitmentIssues.find(issue => issue.key === st.key);			
									const subtaskChangeLog = commitmentIssue && commitmentIssue.changelog && commitmentIssue.changelog.histories || [];
									const historyChange = subtaskChangeLog.filter(history => history.items.some(item => item.field === "status" && ["RESOLVED", "CLOSED", "Rejected (migrated)"].includes(item.toString)));
									const lastHistoryChange = historyChange.sort((a, b) => moment(b.created).diff(moment(a.created)))[0]; // Get the most recent change to a closed status
									
									if (lastHistoryChange)
									{
										ClosureDate = lastHistoryChange;
									}									
								});
							}

                            usEstimations[us.key] = {
                                totalTasks: us.fields.subtasks.length,
                                isClosed: ClosureDate ? moment(ClosureDate).format("DD/MM/YYYY") : null
                            };
                        }
                    });
                }

                var userStories = {};
                var totalTasks = 0;

                if (usResources)
                {
                    $.each(usResources, function(usKey, days)
                    {
                        userStories[usKey] = {
                            days: days,
                            totalTasks: 0,
                            isClosed: null
                        };

                        if (usEstimations[usKey])
                        {
                            userStories[usKey].totalTasks = usEstimations[usKey].totalTasks;
                            userStories[usKey].isClosed = usEstimations[usKey].isClosed;
                        }

                        totalTasks += userStories[usKey].totalTasks;
                    });
                }

                this._usEstimationsCache = { userStories: userStories, totalTasks: totalTasks };
                return this._usEstimationsCache;
            },
            enumerable: false
        },
		filterCommitmentIssues: {
            value: function(issues, usClosureEstimated, ignoredSubtasks)
            {
				var committedIssues = [];
				if (issues && usClosureEstimated)
				{
					var parentKeys = {};
					const ignored = ignoredSubtasks || [];
					committedIssues = issues.filter(issue => 
					{
						var filtered = false;

						if (issue.fields.issuetype.name === "Off-Sprint task")
						{
							filtered = true;
						}

						if (ignored.includes(issue.key))
						{
							return false;
						}

						var parentKey = issue.fields.parent ? issue.fields.parent.key : null;
						filtered = parentKey && usClosureEstimated.hasOwnProperty(parentKey);
						
						if (filtered) 
							parentKeys[parentKey] = true;
						return filtered;
					});
				}

				return committedIssues;				
			},
			enumerable: false
		},
        computeAll : {
            value: function(data, model)
            {
                var self = this;

				if (model.burndownConfig.lines && model.burndownConfig.lines.length > 0)
				{
					model.commitmentIssues = self.filterCommitmentIssues(data.issues, model.sprintDailyBurn.usClosureEstimate, model.ignoredSubtasks);

					$.each(model.burndownConfig.lines, function(_, line)
					{
						switch (line)
						{
							case "globalBurndown":
								model.dataSets.globalBurndown = self.computeBurndownDayToDay(model.commitmentIssues, model.burndownConfig.workingDays, model.dataSets.globalBurndown);
								break;
							case "offSprintHours":
								model.dataSets.offSprintHours = self.computeOffSprintHours(data, model.burndownConfig.workingDays);
								break;
							case "usClosureEstimate":
								model.dataSetsEstimates.usClosureEstimate = self.computeUSClosureEstimate(model.sprintDailyBurn.usClosureEstimate, model.userStories, model.burndownConfig.workingDays, model.commitmentIssues);
								break;
							case "usCompleted":
								model.dataSets.usCompleted = self.computeUSCompleted(model.burndownConfig.workingDays);
								break;
							case  "implementationTasksBurndown":
								model.dataSets.implementationTasksBurndown = self.computeImplementationTaskBurndown(model.commitmentIssues, model.burndownConfig.workingDays, model.dataSets.implementationTasksBurndown);
								break;
							case  "qaTasksBurndown":
								model.dataSets.qaTasksBurndown = self.computeQATaskBurndown(model.commitmentIssues, model.burndownConfig.workingDays, model.dataSets.qaTasksBurndown);
								break;
							case  "testAutoTasksBurndown":
								model.dataSets.testAutoTasksBurndown = self.computeTestAutoTaskBurndown(model.commitmentIssues, model.burndownConfig.workingDays, model.dataSets.testAutoTasksBurndown);
								break;
							default:
								// do nothing
						}
					});
					
					self.computeEstimates(model);
				}
				
				console.log("Burndown Data Sets: ", model.dataSets);
            },
            enumerable: false
        },
		computeEstimates : {
			value: function(model)
			{
				var self = this;

				for (const [lineName, lineData] of Object.entries(model.sprintDailyBurn)) 
				{
					if (lineName === "globalBurndownEstimate")
					{
						model.dataSetsEstimates.globalBurndownEstimate = self.updateBurndownEstimatesDayToDay(lineData, model.dataSets.globalBurndown[0]);
					}

					if (lineName === "implementationTasksBurndown")
					{
						model.dataSetsEstimates.implementationTasksEstimate = self.updateBurndownEstimatesDayToDay(lineData, model.dataSets.implementationTasksBurndown[0]);
					}

					if (lineName === "qaTasksBurndown")
					{
						model.dataSetsEstimates.qaTasksEstimate = self.updateBurndownEstimatesDayToDay(lineData, model.dataSets.qaTasksBurndown[0]);
					}

					if (lineName === "testAutoTasksBurndown")
					{
						model.dataSetsEstimates.testAutoTasksEstimate = self.updateBurndownEstimatesDayToDay(lineData, model.dataSets.testAutoTasksBurndown[0]);
					}

					if (lineName === "usClosureEstimate")
					{
						model.dataSetsEstimates.usClosureEstimate = self.computeUSClosureEstimate(lineData, model.userStories, model.burndownConfig.workingDays, model.commitmentIssues);
					}
					// other estimate lines can be added here ...
				}
			},
			enumerable: false
		},
		computeBurndownDayToDay : {
			/**
			 * 
			 * @param {*} data all the subtasks of the sprint
			 * @param {*} workingDays array of working days in format DD/MM/YYYY
			 * @param {*} currentBurndownDataSets loaded saved burndown data sets
			 * @returns 
			 */
			value: function(data, workingDays, currentBurndownDataSets)
			{
				if (!currentBurndownDataSets)
				{
					currentBurndownDataSets = new Array(workingDays.length + 1).fill(null); // +1 for the START point
				}

				var totalOriginalEstimateHours = 0;
				var totalRemainingEstimateHours = 0;

				$.each(data, function(index, issue)
				{
					if (issue.fields.timetracking && issue.fields.timetracking.originalEstimateSeconds && issue.fields.timetracking.originalEstimateSeconds > 0)
					{
						totalOriginalEstimateHours += Math.round(Number(issue.fields.timetracking.originalEstimateSeconds) / 3600); // in hours
					}

					if (issue.fields.timetracking && issue.fields.timetracking.remainingEstimateSeconds)
					{
						totalRemainingEstimateHours += Math.round(Number(issue.fields.timetracking.remainingEstimateSeconds) / 3600); // in hours
					}
				});

				currentBurndownDataSets[0] = totalOriginalEstimateHours; // START point

				const todayIndex = workingDays.findIndex(day => day === moment().format('DD/MM/YYYY')); // to show the end of the yesterday not the start of today;
				if (todayIndex > 0)
				{					
					currentBurndownDataSets[todayIndex] = totalRemainingEstimateHours;
				}

				return currentBurndownDataSets;

			},
			enumerable: false
		},
		updateBurndownEstimatesDayToDay : {
			/**
			 * Only for dayToDay type, .burndownEstimate line.
			 * @param resources Array of available workers for each day, so lenght = workingDays.length
			 */
			value: function(sprintDailyBurn, totalOriginalEstimateHours)
			{
				const totalWorkingSprintHours = sprintDailyBurn.reduce((sum, dailyBurn) => sum + dailyBurn, 0);
				if (totalWorkingSprintHours === 0) return new Array(sprintDailyBurn.length).fill(totalOriginalEstimateHours);

				
				let remainingWork = totalOriginalEstimateHours;
				const burndownEstimateDataSet = sprintDailyBurn.map(dailyBurn => {
					const burnForDay = (dailyBurn / totalWorkingSprintHours) * totalOriginalEstimateHours;
					remainingWork -= burnForDay;
					return Math.max(remainingWork, 0); // Avoid negative values
				});

				burndownEstimateDataSet.unshift(totalOriginalEstimateHours); // Add the initial estimate at the start of the array
				return burndownEstimateDataSet;
			},
			enumerable: false
		},
		computeOffSprintHours : {
			value: function(data, workingDays)
			{
				var self = this;
				var offSprintHours = new Array(workingDays.length).fill(null);

                var todayIndex = workingDays.findIndex((element) => element == moment().format('DD/MM/YYYY'));

				$.each(workingDays, function(dayIndex, day) 
				{
					if (todayIndex > -1 && dayIndex > todayIndex) // Future day not processed
					{
                        return false;
                    }
                    
                    var totalHoursForDay = 0;
                    
                    $.each(data.issues, function(index, issue)
					{
                        if ((issue && issue.fields && issue.fields.issuetype && issue.fields.issuetype.name === "Off-Sprint task")
							&&
							(issue.fields && issue.fields.worklog && issue.fields.worklog.worklogs)) // Only off-sprint tasks with worklogs
						{
							var hoursForDay = 0;
							$.each(issue.fields.worklog.worklogs, function() 
							{
								var worklogDate = moment(this.started);
								var worklogDayFormatted = worklogDate.format('DD/MM/YYYY');
								
								if (worklogDayFormatted === day) 
								{
									var hoursWorked = this.timeSpentSeconds / 3600;
									hoursForDay += hoursWorked;
								}
							});
							totalHoursForDay += hoursForDay;													
                        }
                    });
                    
                    offSprintHours[dayIndex] = totalHoursForDay;					
				});

				// START X AXIS POINT
				offSprintHours.unshift(null);
				return offSprintHours;
			},
			enumerable: false
		},		
		/**		 * Computes the US Closure Estimate dataset ready for chart rendering.
		 * Merges user story closure data from Jira issues with the UI resource grid (usClosureDates),
		 * then computes cumulative percentages per working day.
		 *
		 * @param {Array} usResources - Line data from UI resource grid. Each entry has format {usKey: string, days: Array<{type, index, snowId}>}.
		 *                              This is the userStories map from saved data (snowId → array of day objects).
		 * @param {Array} usJData - All the user stories of the sprint (Jira API format with fields, subtasks, status, etc.)
		 * @param {Array} workingDays - Array of working days in format DD/MM/YYYY
		 * @returns {Object} Chart.js dataset descriptor for "User Stories" line, with .data, .snowIds, and all visual config.
		 */
		computeUSClosureEstimate : {
			value: function(usResources, usJiraData, workingDays, commitmentIssues)
			{
				var self = this;

				// ── Build and cache usEstimations ──
                var result = self.buildUSEstimations(usResources, usJiraData, commitmentIssues);
                var userStories = result.userStories;
                var totalTasksAllUS = result.totalTasks;

				// ── Step 4: Build additionalData – one entry per US that has a "full" day assigned ──
				var additionalData = [];

				$.each(userStories, function(usKey, usData)
				{
					var totalTasks = usData.totalTasks || 0;
					var percentage = totalTasksAllUS > 0
						? ((totalTasks / totalTasksAllUS) * 100).toFixed(2)
						: 0;

					var mostRecentFullDay = -1;

					if (usData.days && usData.days.length)
					{
						$.each(usData.days, function(j, dayData)
						{
							if (dayData.type === "full")
							{
								mostRecentFullDay = j + 1; // +1 because of the START label in the X axis
							}
						});
					}

					if (mostRecentFullDay !== -1)
					{
						additionalData.push({
							day: mostRecentFullDay,
							percentage: parseFloat(percentage),
							usKey: usKey.split("-").pop(), // Extract numeric part of US key for labeling
							totalTasks: totalTasks
						});
					}
				});

				// ── Step 5: Sort by day and compute cumulative percentages ──
				additionalData.sort(function(a, b) { return a.day - b.day; });

				var cumulativePercentage = 0;
				$.each(additionalData, function(_, data)
				{
					cumulativePercentage += data.percentage;
					data.cumulativePercentage = cumulativePercentage.toFixed(2);
				});

				// ── Step 6: Build the final dataset arrays ──
				var dataArray = new Array(workingDays.length + 1).fill(null);  // +1 for START label
				var usKeysArray = new Array(workingDays.length + 1).fill('');  // +1 for START label

				dataArray[0] = 0;

				$.each(additionalData, function(_, data)
				{
					dataArray[data.day] = parseFloat(data.cumulativePercentage);

					usKeysArray[data.day] = usKeysArray[data.day]
						? usKeysArray[data.day] + ', ' + data.usKey
						: data.usKey;
				});

				return {
					dataSet: dataArray,
					usKeys: usKeysArray
				};
			},
			enumerable: false
		},
		/**
         * Computes the cumulative percentage of completed (closed) user stories per working day.
         * Uses the same usEstimations merge logic as computeUSClosureEstimate, then places
         * each closed US percentage on its closure day and accumulates up to today.
         *
         * @param {Array} workingDays - Array of working days in format DD/MM/YYYY (includes "START" at index 0).
         * @returns {Object} { dataSet: Array } - dataSet has cumulative % per day, ready for chart.
         */
        computeUSCompleted : {
            value: function(workingDays)
            {
                var self = this;

				if (!self._usEstimationsCache) {
					var empty = new Array(workingDays.length).fill(null);
					empty.unshift(null); // START point
					return empty;
				}

				var dataSet = new Array(workingDays.length).fill(null);

				var totalTasksSprint = self._usEstimationsCache.totalTasks || 0;
				$.each(self._usEstimationsCache.userStories, function(_, usData)
				{
					if (usData.isClosed)
					{
						let dayIndex = workingDays.findIndex(day => day === usData.isClosed);

						if (dayIndex === -1 && usData.isClosed > workingDays[workingDays.length - 1])
						{
							dayIndex = workingDays.length - 1;
						}

						const value = (usData.totalTasks / totalTasksSprint) * 100;

						dataSet[dayIndex] = dataSet[dayIndex] ? dataSet[dayIndex] + value : value;
					}
				});

				let todayIndex = workingDays.findIndex((element) => element == moment().format('DD/MM/YYYY'));
				
				if (todayIndex === -1 && workingDays[workingDays.length - 1] < moment().format('DD/MM/YYYY')) {
					todayIndex = workingDays.length - 1;
				}

				let lastValue = 0;
				dataSet.forEach((value, i, arr) => {
					if (i > todayIndex) return;

					if (value !== null && value !== undefined)
					{
						lastValue += value;
					}
					arr[i] = lastValue;
				});

				// START X AXIS POINT
				dataSet.unshift(null);

				return dataSet;
            },
            enumerable: false
        },
		/**
		 * Computes day-to-day burndown for Implementation Task issues.
		 *
		 * @param {Array} committedIssues - Filtered committed issues from the sprint
		 * @param {Array} workingDays - Array of working days in format DD/MM/YYYY
		 * @returns {Array} Burndown data array for Implementation Tasks
		 */
		computeImplementationTaskBurndown : {
			value: function(committedIssues, workingDays, existingDataSet)
			{
				var self = this;
				
				var filteredIssues = committedIssues.filter(function(issue)
				{
					return issue.fields.issuetype.name === "Implementation Task";
				});
				
				var burndownDataSet = existingDataSet || new Array(workingDays.length + 1).fill(null);
				
				if (filteredIssues.length > 0)
				{
					self.computeBurndownDayToDay(filteredIssues, workingDays, burndownDataSet);
				}
				
				return burndownDataSet;
			},
			enumerable: false
		},
		/**
		 * Computes day-to-day burndown for QA Task issues.
		 *
		 * @param {Array} committedIssues - Filtered committed issues from the sprint
		 * @param {Array} workingDays - Array of working days in format DD/MM/YYYY
		 * @returns {Array} Burndown data array for QA Tasks
		 */
		computeQATaskBurndown : {
			value: function(committedIssues, workingDays, existingDataSet)
			{
				var self = this;
				
				var filteredIssues = committedIssues.filter(function(issue)
				{
					return issue.fields.issuetype.name === "sub-Tarea QA";
				});
				
				var burndownDataSet = existingDataSet || new Array(workingDays.length + 1).fill(null);
				
				if (filteredIssues.length > 0)
				{
					self.computeBurndownDayToDay(filteredIssues, workingDays, burndownDataSet);
				}
				
				return burndownDataSet;
			},
			enumerable: false
		},
		/**
		 * Computes day-to-day burndown for Auto Test Task issues.
		 *
		 * @param {Array} committedIssues - Filtered committed issues from the sprint
		 * @param {Array} workingDays - Array of working days in format DD/MM/YYYY
		 * @returns {Array} Burndown data array for Auto Test Tasks
		 */
		computeTestAutoTaskBurndown : {
			value: function(committedIssues, workingDays, existingDataSet)
			{
				var self = this;
				
				var filteredIssues = committedIssues.filter(function(issue)
				{
					return issue.fields.issuetype.name === "sub-Tarea Test Auto";
				});
				
				var burndownDataSet = existingDataSet || new Array(workingDays.length + 1).fill(null);
				
				if (filteredIssues.length > 0)
				{
					self.computeBurndownDayToDay(filteredIssues, workingDays, burndownDataSet);
				}
				
				return burndownDataSet;
			},
			enumerable: false
		}

	});

    helpers.BurndownEngineHelper = BurndownEngineHelper;
})(viewer.helpers);
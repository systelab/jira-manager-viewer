(function(presenters)
{
    function BurndownPresenter(Context)
    {
        this.interactor = Context.getBurndownInteractor();
        this.interactorSettings = Context.getSettingsInteractor();
        this.interactorBoard = Context.getBoardInteractor();
        this.engine = Context.getBurndownEngineHelper();
        this.view = Context.getBurndownView(this);
        this.model = Context.getBurndownModel();
        this.config = null;
        this.view.init();
    }

    Object.defineProperties(BurndownPresenter.prototype,
    {
        getSettings : {
            value: function()
            {
                var self = this;
                    
                this.interactorSettings.load(new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        self.model.onSettingsLoaded(data);
                        self.view.onLoadSettings(data);
                    },
                    function(data)
                    {
                        self.view.showError(data);
                    }));
            },
            enumerable: false
        },
        getIssues : {
            value: function(issues, workingDays)
            {
                var self = this;

                self.model.userStories = issues;
                self.model.burndownConfig.workingDays = workingDays;

                var issuesKeyList = [];
                $.each(issues, function()
                {
                    issuesKeyList.push(this.key);
                });
                    
                this.interactor.getIssues(issuesKeyList, new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        self.engine.computeAll(data, self.model);
                        self.view.onBurndownComputed(self.model.dataSets, self.model.burndownConfig);
                        if (self.model.dataSetsEstimates)
                        {
                            self.view.onEstimateComputed(self.model.dataSetsEstimates);
                        }
                    },
                    function(data)
                    {
                        self.view.showError(data);
                    }));
            },
            enumerable: false
        },
        getSprint : {
            value: function(id)
            {
                var self = this;
                    
                this.interactorBoard.getSprint(id, new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        self.model.onSprint(data);
                    },
                    function(data)
                    {
                        self.view.showError(data);
                    }));
            },
            enumerable: false
        },
		getAssignableUsers : {
            value: function(issue)
            {
                var self = this;
                    
                this.interactor.getAssignableUsers(issue, new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        self.view.onAssignableUsers(data);
                    },
                    function(data)
                    {
                        self.view.showError(data);
                    }));
            },
            enumerable: false
        },
		getUserGroups : {
            value: function(user)
            {
                var self = this;
                    
                this.interactor.getUserGroups(user.accountId, new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        self.view.onUserGroups(user, data);
                    },
                    function(data)
                    {
                        self.view.showError(data);
                    }));
            },
            enumerable: false
        },
		load : {
            value: function(board, sprint)
            {
                var self = this;
                    
                this.interactor.load(board, sprint, new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        self.model.onLoad(data);
                        self.view.onLoad(data);
                    },
                    function(data)
                    {
                        self.view.showError(data);
                    }));
            },
            enumerable: false
        },
		save : {
            value: function(board, sprint, values)
            {
				this.interactor.load(board, sprint, new viewer.listeners.BaseDecisionListener(
				function(data)
				{
                    self.model.onSave(values);

                    values.dataSets = self.model.dataSets;
                    
					self.interactor.save(board, sprint, values, new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        self.engine.computeEstimates(self.model);

                        if (self.model.dataSetsEstimates)
                        {
                            self.view.onEstimateComputed(self.model.dataSetsEstimates);
                        }
                        else
                        {
                            self.view.showError({error: "Estimate dataset could not be computed"});
                        }
                    },
                    function(data)
                    {
                        self.view.showError(data);
                    }));
				},
				function(data)
				{
					self.view.showError(data);
				}));
				
                var self = this;                
            },
            enumerable: false
        }
    });

    presenters.BurndownPresenter = BurndownPresenter;
})(viewer.presenters);
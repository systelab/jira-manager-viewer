(function(presenters)
{
    function BoardPresenter(Context)
    {
        this.interactor = Context.getBoardInteractor();
        this.interactorSettings = Context.getSettingsInteractor();
       
        this.view = Context.getBoardView(this);
        this.view.init();
    }

    Object.defineProperties(BoardPresenter.prototype,
    {
        getIssueTypes : {
            value: function()
            {
                var self = this;
                    
                this.interactor.getIssueTypes(new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        self.view.onIssueTypes(data);
                    },
                    function(data)
                    {
                        self.view.showError(data);
                    }));
            },
            enumerable: false
        },
        getBoards : {
            value: function(startAt = 0)
            {
                var self = this;
                    
                this.interactor.getBoards(startAt, new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        self.view.load(data);
						
						if(!data.isLast)
                        {
                            self.getBoards(startAt + data.values.length);
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
            value: function(board)
            {
                var self = this;
                
                this.interactor.getSprint(board, new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
						$.each(data.values, function()
						{
							if(this.originBoardId == undefined)
							{
								this.originBoardId = board;
							}
						});
						
                        self.view.onSprint(data);
                    },
                    function(data)
                    {
                        self.view.showError(data);
                    }));
            },
            enumerable: false
        },
        getSettings : {
            value: function()
            {
                var self = this;
                    
                this.interactorSettings.load(new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        self.view.onLoadSettings(data);
                    },
                    function(data)
                    {
                        self.view.showError(data);
                    }));
            },
            enumerable: false
        },
        setSetting : {
            value: function(setting, value)
            {
                var self = this;
                this.interactorSettings.load(new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        data[setting] = value;
                        
                        self.interactorSettings.save(data, new viewer.listeners.BaseDecisionListener(
                        function()
                        {
                            self.view.onSaveSetting(data);
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
            },
            enumerable: false
        }
    });

    presenters.BoardPresenter = BoardPresenter;
})(viewer.presenters);
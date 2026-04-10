(function(presenters)
{
    function CSPresenter(Context)
    {
        this.interactor = Context.getCSInteractor();
        this.interactorSettings = Context.getSettingsInteractor();
        this.interactorBoard = Context.getBoardInteractor();

        this.view = Context.getCSView(this);
        this.view.init();
    }

    Object.defineProperties(CSPresenter.prototype,
    {
        getSettings : {
            value: function()
            {
                var self = this;
                    
                this.interactorSettings.load(new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        self.getSprint(data.board.id);
                    },
                    function(data)
                    {
                        self.view.showError(data);
                    }));
            },
            enumerable: false
        },
        getIssues : {
            value: function()
            {
                var self = this;
                
                this.interactorBoard.getBoards(0, new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        self.getCSBoardIssues(data);
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
                        self.view.onSprint(data);
                    },
                    function(data)
                    {
                        self.view.showError(data);
                    }));
            },
            enumerable: false
        },
        getCSBoardIssues : {
            value: function(data)
            {
                var self = this;

                if (!data || !data.values)
                    self.view.showError(data);

                //For each board.values find board containing the name "Customer Support"
                const posibleNames = ["Customer Support", "Customer supports"];
                var boardId = null;
                for (var i = 0; i < data.values.length; i++)
                {
                    if (posibleNames.some(name => data.values[i].name.indexOf(name) !== -1))
                    {
                        boardId = data.values[i].id;
                        break;
                    }
                }

                this.interactor.getCSBoardIssues(boardId, new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        self.view.onSubtasks(data);
                    },
                    function(data)
                    {
                        self.view.showError(data);
                    }));
            },
        }
    });

    presenters.CSPresenter = CSPresenter;
})(viewer.presenters);
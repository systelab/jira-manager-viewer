(function(presenters)
{
    function AnomaliesPresenter(Context)
    {
        this.interactor = Context.getAnomaliesInteractor();
        this.interactorSettings = Context.getSettingsInteractor();
        this.interactorBoard = Context.getBoardInteractor();

        this.view = Context.getAnomaliesView(this);
        this.view.init();
    }

    Object.defineProperties(AnomaliesPresenter.prototype,
    {
        getIssues : {
            value: function(issues)
            {
                var self = this;
                
                this.interactor.getIssues(issues, new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        self.view.onSubtasks(data);
                    },
                    function(data)
                    {
                        self.view.showError(data);
                    }));
            },
            enumerable: false
        },
        getFullWorklog: {
            value: function(issue, attempt = 1)
            {
                var self = this;
                var maxAttempts = 3;
                var baseDelayMs = 1000; // 1s

                this.interactor.getFullWorklog(issue.key, new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        issue.worklog = data;
                        self.view.onWorklog(issue);
                    },
                    function(err)
                    {
                        // Retry on 503 Service Unavailable with exponential backoff
                        var status = (err && err.status) || (err && err.responseJSON && err.responseJSON.status);
                        if (status === 503 && attempt < maxAttempts) {
                            var delay = baseDelayMs * Math.pow(2, attempt - 1); // 1s, 2s, 4s
                            console.warn("getFullWorklog 503, retry " + attempt + "/" + maxAttempts + " in " + delay + "ms");
                            setTimeout(function() {
                                self.getFullWorklog(issue, attempt + 1);
                            }, delay);
                            return;
                        }
                        // Fall back to error handling
                        self.view.showError(err);
                    }
                ));
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
                        self.view.getIssues(data);
                    },
                    function(data)
                    {
                        self.view.showError(data);
                    }));
            },
            enumerable: false
        },
    });

    presenters.AnomaliesPresenter = AnomaliesPresenter;
})(viewer.presenters);
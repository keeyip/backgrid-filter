/*
  backgrid
  http://github.com/wyuenho/backgrid

  Copyright (c) 2013 Jimmy Yuen Ho Wong and contributors
  Licensed under the MIT @license.
*/
describe("A ServerSideFilter", function () {

  var ajax, collection;

  beforeEach(function () {
    collection = new (Backbone.Collection.extend({
      url: "http://www.example.com"
    }))([{id: 1}, {id: 2}]);

    ajax = $.ajax;
  });

  afterEach(function () {
    $.ajax = ajax;
  });

  it("can render a search box with and optional name and a placeholder", function () {
    var filter = new Backgrid.Extension.ServerSideFilter({
      collection: collection,
      name: "name",
      placeholder: "placeholder"
    });
    filter.render();
    expect(filter.searchBox().attr("name")).toBe("name");
    expect(filter.searchBox().attr("placeholder")).toBe("placeholder");

    var filter = new Backgrid.Extension.ServerSideFilter({
      collection: collection,
      name: "name"
    });
    filter.render();
    expect(filter.searchBox().attr("placeholder")).toBeUndefined();
    expect(filter.searchBox().attr("name")).toBe("name");

    var filter = new Backgrid.Extension.ServerSideFilter({
      collection: collection,
      placeholder: "placeholder"
    });
    filter.render();
    expect(filter.searchBox().attr("placeholder")).toBe("placeholder");

    var filter = new Backgrid.Extension.ServerSideFilter({
      collection: collection
    });
    filter.render();
    expect(filter.searchBox().attr("placeholder")).toBeUndefined();
  });

  it("can fetch with a query on submit", function () {
    var url, data;
    $.ajax = function (settings) {
      url = settings.url;
      data = settings.data;
      settings.success([{id: 1}]);
    };
    var filter = new Backgrid.Extension.ServerSideFilter({
      collection: collection
    });
    filter.render();
    filter.searchBox().val("query");
    filter.$el.submit();
    expect(url).toBe("http://www.example.com");
    expect(data).toEqual({q: "query"});
    expect(collection.length).toBe(1);
    expect(collection.at(0).toJSON()).toEqual({id: 1});

    filter = new Backgrid.Extension.ServerSideFilter({
      collection: new Backbone.PageableCollection(null, {
        url: "http://www.example.com"
      })
    });
    filter.render();
    filter.searchBox().val("query");
    filter.$el.submit();
    expect(url).toBe("http://www.example.com");
    expect(data).toEqual({q: "query", page: 1, "per_page": 25});
    expect(collection.length).toBe(1);
    expect(collection.at(0).toJSON()).toEqual({id: 1});
  });

  it("fetches without the query parameter if the search box is empty", function () {
    var url, data;
    $.ajax = function (settings) {
      url = settings.url;
      data = settings.data;
      settings.success([{id: 1}]);
    };
    var filter = new Backgrid.Extension.ServerSideFilter({
      collection: collection
    });
    filter.render();
    filter.searchBox().val("");
    filter.$el.submit();
    expect(url).toBe("http://www.example.com");
    expect(data).toEqual({});
    expect(collection.length).toBe(1);
    expect(collection.at(0).toJSON()).toEqual({id: 1});

    var filter = new Backgrid.Extension.ServerSideFilter({
      collection: new Backbone.PageableCollection(null, {
        url: "http://www.example.com"
      })
    });
    filter.render();
    filter.searchBox().val("");
    filter.$el.submit();
    expect(url).toBe("http://www.example.com");
    expect(data).toEqual({page: 1, "per_page": 25});
    expect(collection.length).toBe(1);
    expect(collection.at(0).toJSON()).toEqual({id: 1});
  });

  it("can persist the filter parameter on pagination", function () {
    var url, data;
    $.ajax = function (settings) {
      url = settings.url;
      data = settings.data;
      settings.success([{id: 2}]);
    };
    collection = new Backbone.PageableCollection([{id: 1}], {
      url: "http://www.example.com",
      state: {
        pageSize: 1,
        totalRecords: 3
      },
      queryParams: {
        totalRecords: null,
        totalPages: null
      }
    });
    var filter = new Backgrid.Extension.ServerSideFilter({
      collection: collection
    });
    filter.render();
    filter.searchBox().val("query");
    collection.getPage(2);
    expect(filter.searchBox().val()).toBe("query");
    expect(url).toBe("http://www.example.com");
    expect(data).toEqual({q: "query", page: 2, "per_page": 1});
    expect(collection.length).toBe(1);
    expect(collection.at(0).toJSON()).toEqual({id: 2});
  });

  it("goes back to the first page when the query changes", function () {
    var url, data;
    $.ajax = function (settings) {
      url = settings.url;
      data = settings.data;
      settings.success([{id: 3}]);
    };
    collection = new Backbone.PageableCollection([{id: 1}, {id: 2}], {
      url: "http://www.example.com",
      state: {
        pageSize: 1,
        totalRecords: 3
      },
      queryParams: {
        totalRecords: null,
        totalPages: null
      }
    });
    var filter = new Backgrid.Extension.ServerSideFilter({
      collection: collection
    });
    filter.render();
    collection.getPage(2);
    filter.searchBox().val("query");
    filter.$el.submit();
    expect(url).toBe("http://www.example.com");
    expect(data).toEqual({q: "query", page: 1, "per_page": 1});
    expect(collection.length).toBe(1);
    expect(collection.state.currentPage).toBe(1);
    expect(collection.state.totalRecords).toBe(3);
    expect(collection.at(0).toJSON()).toEqual({id: 3});

    collection = new Backbone.PageableCollection([{id: 1}, {id: 2}], {
      url: "http://www.example.com",
      state: {
        firstPage: 0,
        pageSize: 1,
        totalRecords: 3
      },
      queryParams: {
        totalRecords: null,
        totalPages: null
      }
    });
    var filter = new Backgrid.Extension.ServerSideFilter({
      collection: collection
    });
    filter.render();
    collection.getNextPage();
    filter.searchBox().val("query");
    filter.$el.submit();
    expect(url).toBe("http://www.example.com");
    expect(data).toEqual({q: "query", page: 0, "per_page": 1});
    expect(collection.length).toBe(1);
    expect(collection.state.currentPage).toBe(0);
    expect(collection.state.totalRecords).toBe(3);
    expect(collection.at(0).toJSON()).toEqual({id: 3});
  });

  it("can clear the search box and refetch upon clicking the cross", function () {
    spyOn(collection, "fetch");
    var filter = new Backgrid.Extension.ServerSideFilter({
      collection: collection
    });
    filter.render();
    filter.searchBox().val("query");
    filter.$el.find(".clear").click();
    expect(filter.searchBox().val()).toBe("");
    collection.fetch.reset();
  });

  it("shows the clear button when the search box has text entered, hides it otherwise", function () {
    var filter = new Backgrid.Extension.ServerSideFilter({
      collection: collection
    });
    filter.render();
    expect(filter.$el.find(".clear").css("display")).toBe("none");

    filter.searchBox().val("query").trigger("keyup");
    expect(filter.$el.find(".clear").css("display")).toBe("inline");

    filter.searchBox().val(null).trigger("keyup");
    expect(filter.$el.find(".clear").css("display")).toBe("none");
  });

});

describe("A ClientSideFilter", function () {

  var collection;

  beforeEach(function () {
    collection = new (Backbone.Collection.extend({
      url: "http://www.example.com"
    }))([{id: 1, name: "alice"},
         {id: 2, name: "alicia"},
         {id: 3, name: "bob"}]);
  });

  it("can perform a regex search on keydown and submit, and cancel on clicking the clear button", function () {
    var filter;

    runs(function () {
      filter = new Backgrid.Extension.ClientSideFilter({
        collection: collection,
        fields: ["name"]
      });
      filter.render();

      expect(collection.length).toBe(3);
      expect(collection.at(0).id).toBe(1);
      expect(collection.at(1).id).toBe(2);
      expect(collection.at(2).id).toBe(3);
    });

    runs(function () {
      filter.searchBox().val("bob").keydown();
    });
    waitsFor(function () {
      return collection.length === 1;
    }, "collection.length to become 1", 500);
    runs(function () {
      expect(collection.at(0).id).toBe(3);
    });

    runs(function () {
      filter.$el.find(".clear").click();
    });
    waitsFor(function () {
      return collection.length === 3;
    }, "collection.length to become 3", 500);
    runs(function () {
      expect(collection.at(0).id).toBe(1);
      expect(collection.at(1).id).toBe(2);
      expect(collection.at(2).id).toBe(3);
    });

    runs(function () {
      filter.searchBox().val("ALICE");
      filter.$el.submit();
    });
    waitsFor(function () {
      return collection.length === 1;
    }, "collection.length to become 1", 500);
    runs(function () {
      expect(collection.at(0).id).toBe(1);
    });

    runs(function () {
      filter.searchBox().val("al").keydown();
    });
    waitsFor(function () {
      return collection.length === 2;
    }, "collection.length to become 2", 500);
    runs(function () {
      expect(collection.at(0).id).toBe(1);
      expect(collection.at(1).id).toBe(2);
    });

    runs(function () {
      filter.searchBox().val("alic bob").keydown();
    });
    waitsFor(function () {
      return collection.length === 3;
    }, "collection.length to become 3", 500);
    runs(function () {
      expect(collection.at(0).id).toBe(1);
      expect(collection.at(1).id).toBe(2);
      expect(collection.at(2).id).toBe(3);
    });
  });

  it("will reflect in the search result when a new model is added to the collection", function () {
    var filter;

    runs(function () {
      filter = new Backgrid.Extension.ClientSideFilter({
        collection: collection,
        fields: ["name"]
      });
      filter.render();
      collection.add({id: 4, name: "doug"});
      filter.searchBox().val("doug").keydown();
    });
    waitsFor(function () {
      return collection.length === 1;
    }, "collection.length to become 1", 500);
    runs(function () {
      expect(collection.at(0).id).toBe(4);
    });

  });

  it("will reflect in the search result when a model is removed from the collection", function () {
    var filter;

    runs(function () {
      filter = new Backgrid.Extension.ClientSideFilter({
        collection: collection,
        fields: ["name"]
      });
      filter.render();
      collection.remove(collection.at(0));
      filter.searchBox().val("alice").keydown();
    });
    waitsFor(function () {
      return collection.length === 0;
    }, "collection.length to become 0", 500);
    runs(function () {
      expect(filter.shadowCollection.length).toBe(2);
      expect(filter.shadowCollection.at(0).id).toBe(2);
      expect(filter.shadowCollection.at(1).id).toBe(3);
    });

  });

  it("will reflect in the search result when a model attribute is changed", function () {
    var filter;

    runs(function () {
      filter = new Backgrid.Extension.ClientSideFilter({
        collection: collection,
        fields: ["name"]
      });
      filter.render();
      filter.collection.at(0).set("name", "charlie");
      filter.searchBox().val("charlie").keydown();
    });
    waitsFor(function () {
      return collection.length === 1;
    }, "collection.length to become 1", 500);
    runs(function () {
      expect(filter.shadowCollection.at(0).id).toBe(1);
      expect(filter.shadowCollection.at(0).get("name")).toBe("charlie");
      expect(filter.collection.at(0).get("name")).toBe("charlie");
    });

  });

  xit("will reflect in the search result when the collection is reset", function () {
    var filter;

    runs(function () {
      filter = new Backgrid.Extension.ClientSideFilter({
        collection: collection,
        fields: ["name"]
      });
      filter.render();
      filter.collection.reset([{id: 4, name: "charlie"}, {id: 5, name: "doug"}]);
      filter.searchBox().val("").keydown();
    });
    waitsFor(function () {
      return collection.length === 2;
    }, "collection.length to become 2", 500);
    runs(function () {
      expect(filter.shadowCollection.at(0).id).toBe(4);
      expect(filter.shadowCollection.at(1).id).toBe(5);
      expect(filter.shadowCollection.at(0).get("name")).toBe("charlie");
      expect(filter.shadowCollection.at(1).get("name")).toBe("doug");
      expect(filter.collection.at(0).id).toBe(4);
      expect(filter.collection.at(1).id).toBe(5);
      expect(filter.collection.at(0).get("name")).toBe("charlie");
      expect(filter.collection.at(1).get("name")).toBe("doug");
    });

  });

  it("goes back to the first page when the query changes", function () {
    var filter;

    runs(function () {
      collection = new Backbone.PageableCollection([
        {id: 1, name: "alice"},
        {id: 2, name: "bob"}], {
        state: {
          pageSize: 1,
        },
        mode: "client"
      });
      filter = new Backgrid.Extension.ClientSideFilter({
        collection: collection,
        fields: ["name"]
      });
      filter.render();
      collection.getPage(2);
      filter.searchBox().val("bob").keydown();
    });
    waitsFor(function () {
      return collection.state.currentPage === 1;
    }, "collection.state.currentPage to become 1", 500);
    runs(function () {
      expect(collection.length).toBe(1);
      expect(filter.shadowCollection.at(0).id).toBe(1);
      expect(filter.shadowCollection.at(1).id).toBe(2);
      expect(filter.shadowCollection.at(0).get("name")).toBe("alice");
      expect(filter.shadowCollection.at(1).get("name")).toBe("bob");
      expect(collection.state.currentPage).toBe(1);
      expect(collection.state.totalRecords).toBe(1);
      expect(collection.at(0).toJSON()).toEqual({id: 2, name: "bob"});
    });
  });

});

describe("A LunrFilter", function () {

  var collection;

  beforeEach(function () {
    collection = new (Backbone.Collection.extend({
      url: "http://www.example.com"
    }))([{id: 1, name: "alice", bio: "a fat cat sat on a mat and ate a fat rat"},
         {id: 2, name: "bob", bio: "he is fat but does not crap"}]);
  });

  it("can perform a full-text search on keydown and submit, and cancel on clicking the clear button", function () {
    var filter;

    runs(function () {
      filter = new Backgrid.Extension.LunrFilter({
        collection: collection,
        fields: {name: 1, bio: 10}
      });
      filter.render();
      expect(collection.length).toBe(2);
      expect(collection.at(0).id).toBe(1);
      expect(collection.at(1).id).toBe(2);
    });

    runs(function () {
      filter.searchBox().val("crap").keydown();
    });
    waitsFor(function () {
      return collection.length === 1;
    }, "collection.length to become 1", 500);
    runs(function () {
      expect(collection.at(0).id).toBe(2);
    });

    runs(function () {
      filter.$el.find(".clear").click();
    });
    waitsFor(function () {
      return collection.length === 2;
    }, "collection.length to become 2", 500);
    runs(function () {
      expect(collection.at(0).id).toBe(1);
      expect(collection.at(1).id).toBe(2);
    });

    runs(function () {
      filter.searchBox().val("alice");
      filter.$el.submit();
    });
    waitsFor(function () {
      return collection.length === 1;
    }, "collection.length to become 1", 500);
    runs(function () {
      expect(collection.at(0).id).toBe(1);
    });

    runs(function () {
      filter.searchBox().val("fat").keydown();
    });
    waitsFor(function () {
      return collection.length === 2;
    }, "collection.length to become 2", 500);
    runs(function () {
      expect(collection.at(0).id).toBe(2);
      expect(collection.at(1).id).toBe(1);
    });
  });

  xit("will reindex on reset", function () {
    var filter = new Backgrid.Extension.LunrFilter({
      collection: collection,
      fields: {name: 1, bio: 10}
    });

    runs(function () {
      filter = new Backgrid.Extension.LunrFilter({
        collection: collection,
        fields: {name: 1, bio: 10}
      });
      filter.render();
      collection.reset([{id: 3, name: "charlie", bio: "The cat scared the bat and sat on the mat."},
                        {id: 4, name: "doug", bio: "The snail hid in his shell. It heard a bell. He went to see it was the church bell."}]);
    });

    runs(function () {
      filter.searchBox().val("crap").keydown();
    });
    waitsFor(function () {
      return collection.length === 0;
    }, "collection.length to become 0", 500);

    runs(function () {
      filter.searchBox().val("alice").keydown();
    });
    waitsFor(function () {
      return collection.length === 0;
    }, "collection.length to become 0", 500);

    runs(function () {
      filter.searchBox().val("charlie").keydown();
    });
    waitsFor(function () {
      return collection.length === 1;
    }, "collection.length to become 1", 500);
    runs(function () {
      expect(collection.at(0).id).toBe(3);
    });

    runs(function () {
      filter.searchBox().val("doug").keydown();
    });
    waitsFor(function () {
      return collection.length === 1 && collection.at(0).id === 4;
    }, "colleciton.length to become 1 and collection.at(0).id to become 4", 500);
  });

  it("will update the index on add", function () {
    var filter;
    runs(function () {
      filter = new Backgrid.Extension.LunrFilter({
        collection: collection,
        fields: {name: 1, bio: 10}
      });
      filter.render();
      collection.add({id: 3, name: "charlie", bio: "The cat scared the bat and sat on the mat."});
    });

    runs(function () {
      filter.searchBox().val("charlie").keydown();
    });
    waitsFor(function () {
      return collection.length === 1;
    }, "collection.length to become 0", 500);
    runs(function () {
      expect(collection.at(0).id).toBe(3);
    });
  });

  it("will update the index on remove", function () {
    var filter;
    runs(function () {
      filter = new Backgrid.Extension.LunrFilter({
        collection: collection,
        fields: {name: 1, bio: 10}
      });
      filter.render();
      collection.remove(collection.last());
    });

    runs(function () {
      filter.searchBox().val("bob").keydown();
    });
    waitsFor(function () {
      return collection.length === 0;
    }, "collection.length to become 0", 500);

    runs(function () {
      filter.searchBox().val("alice").keydown();
    });
    waitsFor(function () {
      return collection.length === 1;
    });
    runs(function () {
      expect(collection.at(0).id).toBe(1);
    });
  });

  it("will update the index on change", function () {
    var filter;

    runs(function () {
      filter = new Backgrid.Extension.LunrFilter({
        collection: collection,
        fields: {name: 1, bio: 10}
      });
      filter.render();
      collection.at(0).set("name", "charlie");
    });

    runs(function () {
      filter.searchBox().val("alice").keydown();
    });
    waitsFor(function () {
      return collection.length === 0;
    }, "collection.length to become 0", 500);

    runs(function () {
      filter.searchBox().val("charlie").keydown();
    });
    waitsFor(function () {
      return collection.length === 1;
    }, "collection.length to become 1", 500);

    runs(function () {
      expect(collection.at(0).id).toBe(1);
    });
  });

  it("can clear the search box and reindex upon clicking the clear button", function () {
    var filter;

    runs(function () {
      filter = new Backgrid.Extension.LunrFilter({
        collection: collection,
        fields: {name: 1, bio: 10}
      });
      filter.render();
    });

    runs(function() {
      filter.searchBox().val("crap").keydown();
    });
    waitsFor(function () {
      return collection.length === 1;
    }, "collection.length to become 1", 500);

    runs(function () {
      filter.$el.find(".clear").click();
    });
    waitsFor(function () {
      return collection.length === 2;
    }, "collection.length to become 2", 500);
    runs(function () {
      expect(filter.searchBox().val()).toBe('');
      expect(collection.at(0).id).toBe(1);
      expect(collection.at(1).id).toBe(2);
    });
  });

});

'use strict';
const expect = require('chai').expect;

require('../electron/testCoverage.js');

describe('babys first test', ()=>{
  it('should always be true - dummy test', function(){
    expect(true).to.be.ok;
  });

  it('should evaluate to true', ()=>{
    expect(false).to.not.be.ok;
  });
});

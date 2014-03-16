#! /usr/bin/env python
import subprocess

print '\n'
print '==================='
print 'Compiler tests'
print '==================='
subprocess.call(["compiler/runtests.py"])

print '\n'
print '==================='
print 'EtherEx simulations'
print '==================='
subprocess.call(["cll-sim/run.py", "simulations/etherex.py"])

print '\n'
print '==================='
print 'EtherEx LVM'
print '==================='
subprocess.call(["compiler/cllcompiler.py", "contracts/etherex.cll"])

print '\n'
print '==================='
print 'WARNING: Experimental code, use at your own risks.'
print '==================='
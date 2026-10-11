require 'fileutils'
require 'xcodeproj'

output = File.expand_path(ARGV.fetch(0))
raise "output already exists: #{output}" if File.exist?(output)
FileUtils.mkdir_p(output)
project = Xcodeproj::Project.new(File.join(output, 'LiquidGlassUITests.xcodeproj'))
target = project.new_target(:ui_test_bundle, 'LiquidGlassUITests', :ios, '15.1')
source = project.main_group.new_file(File.join(__dir__, 'LiquidGlassScreenshots.swift'))
target.source_build_phase.add_file_reference(source)
target.build_configurations.each do |configuration|
  configuration.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = 'unif.design.glassuitests'
  configuration.build_settings['SWIFT_VERSION'] = '5.0'
  configuration.build_settings['GENERATE_INFOPLIST_FILE'] = 'YES'
  configuration.build_settings['CODE_SIGNING_ALLOWED'] = 'NO'
  configuration.build_settings['TARGETED_DEVICE_FAMILY'] = '1'
end
project.save
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(target)
scheme.add_test_target(target)
scheme.save_as(project.path, 'LiquidGlassUITests', true)
puts project.path
